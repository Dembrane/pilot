import os
import argparse


def main():
    # Create the parser
    parser = argparse.ArgumentParser(
        description="Walk through a directory and load in to the database"
    )
    # Add an argument for the directory
    parser.add_argument("directory", type=str, help="Directory.")

    # Parse the arguments
    args = parser.parse_args()

    # Get the directory from the arguments
    directory = args.directory

    # Check if the directory exists
    if not os.path.exists(directory):
        print("The specified directory does not exist.")
        return

    # Walk through the directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            print(os.path.join(root, file))


if __name__ == "__main__":
    main()
