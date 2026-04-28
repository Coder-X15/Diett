#! /bin/usr/env python3
from model import get_model, train, evaluate
from dataloader import get_dataloader
import torch
import os
import dotenv

dotenv.load_dotenv()
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