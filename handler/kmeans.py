from valid.valid_request import valid_kmeans_request
from data.data_loader import DataLoader 
from model.k_means import K_Means

def kmeans(payload):
    try: 
        if valid_kmeans_request(payload):
            cluster = int(payload["cluster"])
            iteration = int(payload["iteration"])
            distance_type = payload["distanceType"]
            csv_file_buffer = payload["buffer"]
            
            data_loader = DataLoader()

            df = data_loader.load_data(csv_file_buffer=csv_file_buffer)

            kmeans = K_Means(cluster, iteration)

            kmeans.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name)

            return kmeans.toJson(additionInfo={ "header": data_loader.header, "data_name": data_loader.data_name })
        else:
            return "Invalid parameter"
    except Exception as e:
        print(e)
        return "Internal server error"