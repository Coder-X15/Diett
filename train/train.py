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
import torchvision.datasets as ImageFolder
import torchvision.transforms as transforms
from torch.utils.data import DataLoader

dotenv.load_dotenv()

## --- COMMAND DEFINITIONS ---
def command(cmd : str) -> None:
    print(f"Running command: {cmd}")
    result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(result.stdout.decode())
    if result.stderr:
        print(result.stderr.decode())
    

def train_mock() -> None:
    data = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.2, random_state=42)
    model = LogisticRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Mock training completed with accuracy: {accuracy:.4f}")

    # dump the model to a file
    dump(model, "mock_model.joblib")

## --- DATA LOADING AND MODEL DEFINITIONS ---
# 1. We're using the pretrained ResNet-18 model

def get_model(num_classes):
    model = models.resnet18(pretrained=True)

    # modify the last layer of the model
    # to match the number of classes in our dataset
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    return model

# defining the training loop
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
    dataset = ImageFolder(root=data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    return dataloader

## --- TRAINING LOOP ---
def train() -> None:
    model = get_model(
        num_classes=int(os.getenv("NUM_CLASSES", 10))
        )  # assuming we have 10 classes
    train_dataloader = get_dataloader(
        data_dir=os.getenv("TRAIN_DATA_DIR", "data"),
        batch_size=int(os.getenv("BATCH_SIZE", 32))
        )
    validation_dataloader = get_dataloader(
        data_dir=os.getenv("VALIDATION_DATA_DIR", "data"),
        batch_size=int(os.getenv("BATCH_SIZE", 32))
        )
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    num_epochs = int(os.getenv("NUM_EPOCHS", 10))
    for epoch in range(num_epochs):
        epoch_loss = train(
            model,
            train_dataloader,
            criterion,
            optimizer,
            device
            )
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss:.4f}")
        evaluate(
            model,
            validation_dataloader,
            criterion,
            device
            )
        
if __name__ == "__main__":
    train_mock()