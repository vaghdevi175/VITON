import torch
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
from viton.datasets import VITONDataset  # <-- Using your official dataset file!
from viton.networks import SegGenerator
from options import SegOptions
import cv2
import os.path as osp
from PIL import Image
from torchvision import transforms
import torch.nn.functional as F
import torchgeometry as tgm

def gen_noise(shape):
    noise = np.zeros(shape, dtype=np.float32)
    noise = cv2.randn(noise, 0, 1) 
    return torch.tensor(noise, dtype=torch.float32)

def decode_segmap(label_map, num_classes=13):
    colors = np.array([
        [0,0,0], [128,0,0], [255,0,0], [0,85,0], [170,0,51], [255,85,0],
        [0,0,85], [0,119,221], [85,85,0], [0,85,85], [85,51,0], [52,86,128], [0,128,0]
    ])
    h, w = label_map.shape
    color_image = np.zeros((h, w, 3))
    for i in range(num_classes):
        color_image[label_map == i] = colors[i]
    return color_image / 255

def visualize_seg():
    opt = SegOptions()
    opt.load_height, opt.load_width = 1024, 768 
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    dataset = VITONDataset(opt) 
    # 1. Set shuffle to FALSE so the order never changes
    loader = DataLoader(dataset, batch_size=1, shuffle=False)

    model = SegGenerator(opt, input_nc=21, output_nc=opt.semantic_nc).to(device)
    model.load_state_dict(torch.load("viton/checkpoints/seg_final.pth", map_location=device))
    model.eval()


    target_image_index = 5

    with torch.no_grad():
        for current_index, data in enumerate(loader):

            if current_index < target_image_index:
                continue

            cm = data["cloth_mask"]["unpaired"].to(device)
            c_masked = (data["cloth"]["unpaired"] * cm).to(device)
            parse_agnostic = data["parse_agnostic"].to(device)
            pose = data["pose"].to(device)
            
            # DOWNSAMPLE inputs
            cm_down = F.interpolate(cm, size=(256, 192), mode='nearest')
            c_masked_down = F.interpolate(c_masked, size=(256, 192), mode='bilinear')
            parse_agnostic_down = F.interpolate(parse_agnostic, size=(256, 192), mode='nearest')
            pose_down = F.interpolate(pose, size=(256, 192), mode='bilinear')
            
            noise = gen_noise(cm_down.size()).to(device)

            # Construct 21-channel input
            input_tensor = torch.cat([cm_down, c_masked_down, parse_agnostic_down, pose_down, noise], 1)
            
            # Inference & Upsample
            pred_down = model(input_tensor)
            pred_up = F.interpolate(pred_down, size=(1024, 768), mode='bilinear', align_corners=False)
            
            # Smooth & Argmax
            gauss = tgm.image.GaussianBlur((15, 15), (3, 3)).to(device)
            pred_smooth = gauss(pred_up)
            pred = torch.argmax(pred_smooth, dim=1)

            # Extract images for plotting
            img = data["img"][0].cpu().permute(1,2,0).numpy()
            img = (img * 0.5) + 0.5 
            
            # LOAD GROUND TRUTH MANUALLY FOR PLOTTING
            img_name = data["img_name"][0]
            parse_path = osp.join(opt.dataset_dir, opt.dataset_mode, 'image-parse', img_name.replace('.jpg', '.png'))
            gt_parse = Image.open(parse_path)
            gt_parse = transforms.Resize((1024, 768), interpolation=Image.NEAREST)(gt_parse)
            
            label_map = {0:0, 1:1, 2:1, 3:11, 4:2, 5:3, 6:3, 7:3, 8:11, 9:4, 10:0, 11:12, 12:4, 13:2, 14:5, 15:6, 16:7, 17:8, 18:9, 19:10}
            gt_array = np.array(gt_parse)
            gt_clean = np.zeros_like(gt_array)
            for raw_val, map_val in label_map.items():
                gt_clean[gt_array == raw_val] = map_val

            gt = gt_clean.astype(np.uint8)
            pr = pred[0].cpu().numpy().astype(np.uint8)
            pr = cv2.medianBlur(pr, 15)

            gt_color = decode_segmap(gt)
            pr_color = decode_segmap(pr)

            plt.figure(figsize=(15, 5))
            plt.subplot(1,3,1); plt.title("Original Person"); plt.imshow(np.clip(img, 0, 1)); plt.axis("off")
            plt.subplot(1,3,2); plt.title("Ground Truth"); plt.imshow(gt_color); plt.axis("off")
            plt.subplot(1,3,3); plt.title("Prediction"); plt.imshow(pr_color); plt.axis("off")
            plt.show()
            
            # Stop the loop after showing your chosen image
            break

if __name__ == "__main__":
    visualize_seg()