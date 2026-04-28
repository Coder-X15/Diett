#! /bin/usr/env python3

# we need to set up our environment in the Kaggle server so maybe we'll need to clone this repo
import os
import subprocess
import os
import sys
from pathlib import Path


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
    

def train_mock() -> None:
    print("This is a mock training function")
    command("echo 'Training complete!' >> ./logs/train.txt")

if __name__ == "__main__":
    setup()    
    train_mock()