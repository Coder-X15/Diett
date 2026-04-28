#! /usr/bin/env python
import torch
import torchvision.models as models
import tqdm
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