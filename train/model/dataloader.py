#! /usr/bin/env python3
import torchvision.datasets as ImageFolder
import torchvision.transforms as transforms
from torch.utils.data import DataLoader

# Define the transformations to apply to the images
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225])
])

def get_dataloader(data_dir, batch_size):
    # load the dataset from the specified directory and apply the transformations
    dataset = ImageFolder(root=data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    return dataloader