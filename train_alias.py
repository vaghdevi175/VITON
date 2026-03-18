import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

from viton.datasets import VITONDataset
from viton.networks import ALIASGenerator


# -----------------------------
# Simple PatchGAN Discriminator
# -----------------------------
class Discriminator(nn.Module):
    def __init__(self, input_nc=3):
        super().__init__()

        self.model = nn.Sequential(
            nn.Conv2d(input_nc, 64, 4, 2, 1),
            nn.LeakyReLU(0.2),

            nn.Conv2d(64, 128, 4, 2, 1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2),

            nn.Conv2d(128, 256, 4, 2, 1),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2),

            nn.Conv2d(256, 512, 4, 1, 1),
            nn.BatchNorm2d(512),
            nn.LeakyReLU(0.2),

            nn.Conv2d(512, 1, 4, 1, 1)
        )

    def forward(self, x):
        return self.model(x)


def train_alias(opt):

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    os.makedirs(opt.checkpoint_dir, exist_ok=True)

    # -----------------------------
    # Dataset
    # -----------------------------
    train_dataset = VITONDataset(opt)

    train_loader = DataLoader(
        train_dataset,
        batch_size=opt.batch_size,
        shuffle=True,
        num_workers=4
    )

    # -----------------------------
    # Networks
    # -----------------------------
    generator = ALIASGenerator(opt, input_nc=9).to(device)
    discriminator = Discriminator().to(device)

    # -----------------------------
    # Optimizers
    # -----------------------------
    optimizer_G = optim.Adam(generator.parameters(), lr=0.0002, betas=(0.5, 0.999))
    optimizer_D = optim.Adam(discriminator.parameters(), lr=0.0002, betas=(0.5, 0.999))

    # -----------------------------
    # Losses
    # -----------------------------
    criterionGAN = nn.BCEWithLogitsLoss()
    criterionL1 = nn.L1Loss()

    print("Start Professional ALIAS Training...")

    num_epochs = 40

    for epoch in range(1, num_epochs + 1):

        epoch_total = 0
        epoch_l1 = 0
        epoch_gan = 0

        for i, data in enumerate(train_loader):

            person = data["image"].to(device)
            cloth = data["cloth"].to(device)
            warped_cloth = data["warped_cloth"].to(device)
            parse = data["parse"].to(device)

            input_G = torch.cat([cloth, warped_cloth, parse], dim=1)

            fake_image = generator(input_G, parse, parse, None)

            # -----------------------
            # Train Discriminator
            # -----------------------
            optimizer_D.zero_grad()

            pred_real = discriminator(person)
            pred_fake = discriminator(fake_image.detach())

            real_label = torch.ones_like(pred_real)
            fake_label = torch.zeros_like(pred_fake)

            loss_D_real = criterionGAN(pred_real, real_label)
            loss_D_fake = criterionGAN(pred_fake, fake_label)

            loss_D = (loss_D_real + loss_D_fake) * 0.5
            loss_D.backward()
            optimizer_D.step()

            # -----------------------
            # Train Generator
            # -----------------------
            optimizer_G.zero_grad()

            pred_fake = discriminator(fake_image)

            loss_G_GAN = criterionGAN(pred_fake, real_label)
            loss_G_L1 = criterionL1(fake_image, person)

            loss_G = loss_G_GAN + 10 * loss_G_L1

            loss_G.backward()
            optimizer_G.step()

            epoch_total += loss_G.item()
            epoch_l1 += loss_G_L1.item()
            epoch_gan += loss_G_GAN.item()

    avg_total = epoch_total / len(train_loader)
    avg_l1 = epoch_l1 / len(train_loader)
    avg_gan = epoch_gan / len(train_loader)

    print(
        f"Epoch [{epoch}/40] "
        f"Total: {avg_total:.4f} | "
        f"L1: {avg_l1:.4f} | "
        f"GAN: {avg_gan:.4f}"
    )

    torch.save(
        generator.state_dict(),
        os.path.join(opt.checkpoint_dir, f"alias_epoch_{epoch}.pth")
    )

print("ALIAS training finished.")