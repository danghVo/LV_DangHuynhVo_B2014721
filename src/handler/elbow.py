from loader.data_loader import DataLoader 
from model.k_means import K_Means                                 
# from utils.mongo_client import MongoClient
import numpy as np
import matplotlib.pyplot as plt


def elbow(payload):
    csv_file_buffer = payload["buffer"]
    distance_type = payload["distanceType"]

    data_loader = DataLoader()

    df = data_loader.load_data(csv_file_buffer=csv_file_buffer)
    WCSS=[]
    for i in range(1,20):
        kmeans = K_Means(i)
        kmeans.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name.copy())

        last_iteration = kmeans.iteration_data[-1]
        
        WCSS_each_k = 0
        for i, centroid in last_iteration["centroids"]:
           WCSS_each_k += sum([np.square(centroid - point) for point in last_iteration["labels"][i]])

        WCSS.append(WCSS_each_k)


    plt.plot(range(1,20),WCSS)