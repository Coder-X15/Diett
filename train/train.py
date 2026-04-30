#! /bin/usr/env python3
import torch
import os
import dotenv
import os
import subprocess
import os
import sys
from pathlib import Path
# mock training using the sklearn iris dataset of a simple logistic regression model
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from joblib import dump
import torch
import torchvision.models as models
import tqdm
from torchvision.datasets import ImageFolder
from torchvision.transforms import transforms
from torch.utils.data import DataLoader

device = None 
try:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    # Test CUDA availability
    if device.type == 'cuda':
        torch.zeros(1).to(device)
except RuntimeError:
    device = torch.device('cpu')
    print("CUDA unavailable, falling back to CPU")

# GLOBALS
TRAIN_DATA_DIR = os.getenv("TRAIN_DATA_DIR", "food20dataset/train_set")
VALIDATION_DATA_DIR = os.getenv("VALIDATION_DATA_DIR", "food20dataset/test_set")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 32))
NUM_EPOCHS = int(os.getenv("NUM_EPOCHS", 10))


## --- COMMAND DEFINITIONS ---
def command(cmd : str) -> None:
    print(f"Running command: {cmd}")
    result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(result.stdout.decode())
    if result.stderr:
        print(result.stderr.decode())

## --- DOWNLOADING THE DATASET ---
command("kaggle datasets download cdart99/food20dataset -p . --unzip")

## --- DATA LOADING AND MODEL DEFINITIONS ---
# 1. We're using the pretrained ResNet-18 model

def get_model(num_classes):
    model = models.resnet18(pretrained=True)

    # modify the last layer of the model
    # to match the number of classes in our dataset
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    return model

# defining each training epoch
def train(model, dataloader, criterion, optimizer, device):
    model.train()  # set the model to training mode
    running_loss = 0.0
    for inputs, labels in tqdm.tqdm(dataloader):
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()  # zero the parameter gradients

        outputs = model(inputs)  # forward pass
        loss = criterion(outputs, labels)  # compute the loss
        loss.backward()  # backward pass
        optimizer.step()  # update the weights

        running_loss += loss.item() * inputs.size(0)

    epoch_loss = running_loss / len(dataloader.dataset)
    return epoch_loss

# defining the evaluation step
def evaluate(model, dataloader, criterion, device):
    model.eval()  # set the model to evaluation mode
    running_loss = 0.0
    correct_predictions = 0
    total_predictions = 0

    with torch.no_grad():  # disable gradient computation
        for inputs, labels in tqdm.tqdm(dataloader):
            inputs, labels = inputs.to(device), labels.to(device)

            outputs = model(inputs)  # forward pass
            loss = criterion(outputs, labels)  # compute the loss
            running_loss += loss.item() * inputs.size(0)

            _, predicted = torch.max(outputs, 1)  # get the predicted class
            correct_predictions += (predicted == labels).sum().item()
            total_predictions += labels.size(0)

    epoch_loss = running_loss / len(dataloader.dataset)
    accuracy = correct_predictions / total_predictions
    return epoch_loss, accuracy

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
    # since our dataset contains sub-folders for each class with the corresponding images in them,
    dataset = ImageFolder(root=data_dir, transform=transform)
    print(dataset.classes)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    return dataloader

## --- TRAINING LOOP ---
def train_loop() -> None:
    train_dataloader = get_dataloader(
        data_dir=TRAIN_DATA_DIR,
        batch_size=BATCH_SIZE
        )
    validation_dataloader = get_dataloader(
        data_dir=VALIDATION_DATA_DIR,
        batch_size=BATCH_SIZE
        )
    model = get_model(
        num_classes= len(train_dataloader.dataset.classes)
        )  # assuming we have 10 classes 
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    model.to(device)
    num_epochs = NUM_EPOCHS
    for epoch in range(num_epochs):
        epoch_loss = train(
            model,
            train_dataloader,
            criterion,
            optimizer,
            device
            )
        
        eval_loss, accuracy = evaluate(
            model,
            validation_dataloader,
            criterion,
            device
            )
        print(f"Epoch {epoch+1}/{num_epochs}, Train Loss: {epoch_loss:.4f}, Validation Loss: {eval_loss:.4f}, Accuracy: {accuracy:.4f}")
    # save model
    torch.save(model.state_dict(), "model.pth")
        
if __name__ == "__main__":
    # checking GPU specs
    command("nvidia-smi")
    # Install torch/torchvision with explicit CUDA 12 support to match cuml-cu12 requirements
    command("pip install --upgrade torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu124")
    train_loop()