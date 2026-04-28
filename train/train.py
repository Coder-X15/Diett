#! /bin/usr/env python3

# we need to set up our environment in the Kaggle server so maybe we'll need to clone this repo
import os
import subprocess
import dotenv
import torch
import os
import sys
from pathlib import Path

# Add the project root to Python path
train_root = Path(__file__).parent
sys.path.insert(0, str(train_root))
from model import get_model, train, evaluate
from dataloader import get_dataloader

dotenv.load_dotenv()


def command(cmd : str) -> None:
    print(f"Running command: {cmd}")
    result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(result.stdout.decode())
    if result.stderr:
        print(result.stderr.decode())

def setup() -> None:
    # Clone the repository
    command("git clone https://github.com/Coder-X15/Diett.git")
    # Change to the train directory
    os.chdir("Diett/train")
    # Install the requirements
    command("pip install -r requirements.txt")
    

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
def train_mock() -> None:
    print("This is a mock training function")
    command("echo 'Training complete!' >> training.txt")

if __name__ == "__main__":
    setup()    
    train_mock()