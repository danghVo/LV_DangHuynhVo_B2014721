from valid.valid_request import valid_kmeans_request
from loader.data_loader import DataLoader 
from model.k_means import K_Means
from draw.kmeans import draw_kmeans_graph                                   
from utils.mongo_client import MongoDBClient
import json

def kmeans(payload):
    try: 
        if valid_kmeans_request(payload):
            db = MongoDBClient()

            cluster = int(payload["cluster"])
            iteration = int(payload["iteration"])
            distance_type = payload["distanceType"]
            csv_file_buffer = payload["buffer"]

            init_centroids = None

            data_loader = DataLoader()

            df = data_loader.load_data(csv_file_buffer=csv_file_buffer)

            if("initCentroidLine" in payload):
                init_centroids_index = payload["initCentroidLine"]
                if init_centroids_index:
                    init_centroids = []

                    for init_centroid_index in init_centroids_index:
                        init_centroids.append(df.iloc[init_centroid_index].values.tolist()) 

            kmeans = K_Means(cluster, iteration)

            kmeans.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name.copy(), init_centroids=init_centroids)

            # draw_kmeans_graph(*kmeans.getPlotData())
            response = kmeans.toJson(additionInfo={ "header": data_loader.header, "data_name": data_loader.data_name })

            db.insert({ "userUuid": payload["userUuid"], "data": json.loads(response) })

            return response
        else:
            return "Invalid parameter"
    except Exception as e:
        print(("Kmeans handler error ", e))
        return "Internal server error"