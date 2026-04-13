import torch
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
from viton.datasets import VITONDataset  # <-- Switched to your official dataset
from viton.networks import GMM
from options import GMMOptions
import torch.nn.functional as F

def visualize_gmm():
    opt = GMMOptions()
    opt.load_height, opt.load_width = 1024, 768
    opt.semantic_nc = 13
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 1. Dataset & DataLoader (shuffle=False to lock the image)
    dataset = VITONDataset(opt)
    loader = DataLoader(dataset, batch_size=1, shuffle=False)

    # 2. Load GMM Model
    model = GMM(opt, inputA_nc=7, inputB_nc=3).to(device)
    
    # FIX: Corrected the path to your checkpoint folder!
    model.load_state_dict(torch.load("viton/checkpoints/gmm_final.pth", map_location=device))
    model.eval()

    # 3. Choose your perfect image index (Change this number to pick the image!)
    target_image_index = 6


    with torch.no_grad():
        for current_index, data in enumerate(loader):
            if current_index < target_image_index:
                continue

            # Get inputs
            img = data["img"].to(device)
            img_agnostic = data["img_agnostic"].to(device)
            parse_agnostic = data["parse_agnostic"].to(device)
            pose = data["pose"].to(device)
            c = data["cloth"]["unpaired"].to(device)

            # 4. DOWNSAMPLE inputs for GMM (Trained at 256x192)
            # Class 3 in the 13-channel parse_agnostic is the upper clothing region
            parse_cloth_gmm = F.interpolate(parse_agnostic[:, 3:4], size=(256, 192), mode='nearest')
            pose_gmm = F.interpolate(pose, size=(256, 192), mode='nearest')
            agnostic_gmm = F.interpolate(img_agnostic, size=(256, 192), mode='nearest')
            c_gmm = F.interpolate(c, size=(256, 192), mode='nearest')

            # Construct 7-channel input: 1 (parse) + 3 (pose) + 3 (agnostic)
            gmm_input = torch.cat((parse_cloth_gmm, pose_gmm, agnostic_gmm), dim=1)

            # 5. Forward pass through GMM to get the warping grid
            theta, warped_grid = model(gmm_input, c_gmm)

            # 6. UPSAMPLE the predicted grid back to 1024x768 
            warped_grid_up = F.interpolate(warped_grid.permute(0, 3, 1, 2), size=(1024, 768), mode='bilinear', align_corners=False).permute(0, 2, 3, 1)

            # 7. Warp the high-res cloth using the upsampled grid
            warped_c = F.grid_sample(c, warped_grid_up, padding_mode='border', align_corners=True)

            # Convert tensors to numpy images for plotting
            img_np = (img[0].cpu().permute(1, 2, 0).numpy() * 0.5) + 0.5
            c_np = (c[0].cpu().permute(1, 2, 0).numpy() * 0.5) + 0.5
            warped_c_np = (warped_c[0].cpu().permute(1, 2, 0).numpy() * 0.5) + 0.5
            agnostic_np = (img_agnostic[0].cpu().permute(1, 2, 0).numpy() * 0.5) + 0.5

            # --- PLOT 4 IMAGES ---

            plt.figure(figsize=(20, 5))

            plt.subplot(1, 3, 1)
            plt.title("Original Person")
            plt.imshow(np.clip(img_np, 0, 1))
            plt.axis("off")

            plt.subplot(1, 3, 2)
            plt.title("Target Cloth (Flat)")
            plt.imshow(np.clip(c_np, 0, 1))
            plt.axis("off")
            
            
            plt.subplot(1, 3, 3)
            plt.title("Warped Cloth (GMM Output)")
            plt.imshow(np.clip(warped_c_np, 0, 1))
            plt.axis("off")
            
            
            plt.show()
            break

if __name__ == "__main__":
    visualize_gmm()