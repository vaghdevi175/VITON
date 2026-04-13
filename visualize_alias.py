import os
import matplotlib.pyplot as plt
from PIL import Image

result_folder = "results/viton_test"
person_folder = "dataset/test/image"
cloth_folder = "dataset/test/cloth"

files = sorted(os.listdir(result_folder))

for result_name in files:

    parts = result_name.split("_")
    person_id = parts[0]
    cloth_id = parts[1]

    person_path = os.path.join(person_folder, f"{person_id}_00.jpg")
    cloth_path = os.path.join(cloth_folder, f"{cloth_id}_00.jpg")
    output_path = os.path.join(result_folder, result_name)

    person = Image.open(person_path)
    cloth = Image.open(cloth_path)
    output = Image.open(output_path)

    plt.figure(figsize=(12,4))

    plt.subplot(1,3,1)
    plt.title("Person")
    plt.imshow(person)
    plt.axis("off")

    plt.subplot(1,3,2)
    plt.title("Cloth")
    plt.imshow(cloth)
    plt.axis("off")

    plt.subplot(1,3,3)
    plt.title("Try-On Output")
    plt.imshow(output)
    plt.axis("off")

    plt.show()

    input("Press ENTER to show next result...")
