from data.data_loader import DataLoader 
from model.hierarchical import Hierarchical
from model.k_means import K_Means
import sys
import os

if __name__ == "__main__":
    algorithm = sys.argv[1]

    if algorithm == "kmeans":
        cluster = int(sys.argv[2])
        iteration = int(sys.argv[3])
        distance_type = sys.argv[4]
        csv_file_path = sys.argv[5]

        data_loader = DataLoader()
        # print the current path of main.py

        df = data_loader.load_data(csv_file_path=csv_file_path)

        kmeans = K_Means(cluster, iteration)

        kmeans.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name)

        print(kmeans.toJson(additionInfo={ "header": data_loader.header, "data_name": data_loader.data_name }))
    elif algorithm == "hierarchical":
        link_method = sys.argv[2]
        distance_type = sys.argv[3]
        csv_file_path = sys.argv[4]

        data_loader = DataLoader()

        df = data_loader.load_data(csv_file_path=csv_file_path)

        hierarchical = Hierarchical(linked_method=link_method)

        hierarchical.fit(data=df, distance_type=distance_type, data_name=data_loader.data_name)

        print(hierarchical.toJson(additionInfo={ "header": data_loader.header, "data_name": data_loader.data_name }))