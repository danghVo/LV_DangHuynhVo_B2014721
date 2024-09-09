# Import
import pandas as pd
from sklearn.preprocessing import StandardScaler
import base64
from io import BytesIO

class DataLoader:

    def __init__(self) -> None:
        pass

    # Preprocess the dataset
    def preprocess_data(self, data):
        scaler = StandardScaler() 
        scaled_data = scaler.fit_transform(data)

        return data

    # Load the dataset
    def load_data(self, csv_file_buffer):
        try:
            # Decode the base64 string to bytes
            csv_file_buffer = base64.b64decode(csv_file_buffer)
            buffer = BytesIO(csv_file_buffer)

            data = pd.read_csv(filepath_or_buffer=buffer)
            self.raw_data = data

            # Delete header
            self.header = data.columns.values
            data.drop(index=0)

            # Delete first column (data's name)
            self.data_name = data.iloc[:, 0]
            data.drop(columns=data.columns[0], axis=1, inplace=True)

            # Remove column have invalid type
            cols = data.columns
            for col, type in zip(cols, data.dtypes):
                if(pd.api.types.is_numeric_dtype(type)):
                    data[[col]] = self.preprocess_data(data[[col]])
                else:
                    del data[col]

            # Return the dataset
            return data
        except FileNotFoundError:
            print("File not found. Please check the path and try again.")
            return None

       
        