import numpy as np
import json

from utils.distance_utils import Distance
from utils.json_encoder import json_encoder

# Finding best number of cluster

class K_Means:
    def __init__ (self, cluster, iteration = 300):
        self.cluster = cluster
        self.iteration = iteration
        
    def fit(self, data, distance_type, data_name, init_centroids = None):
        # Random centroid
        self.init_centroids = init_centroids or data.sample(n=self.cluster, axis=0).values.tolist()

        prev_centroids = None
        iteration = 0
        labels = []
        labelsInName = []
        centroids = self.init_centroids
        self.iteration_data = []
        distanceFormula = Distance(distance_type).calculate

        while np.not_equal(centroids, prev_centroids).any() and iteration < self.iteration:
            labels = [[] for _ in range(self.cluster)]
            labelsInName = [[] for _ in range(self.cluster)]
            distances = []
            cluster_of_points = []

            for index, element in enumerate(data.values):
                distance = [distanceFormula(element, centroid) for centroid in centroids]
                centroid_idx = np.argmin(distance)
                labels[centroid_idx].append(element)
                labelsInName[centroid_idx].append(data_name[index])

                distances.append(distance)
                cluster_of_points.append(centroid_idx.item())

            iteration += 1
            prev_centroids = centroids
            centroids = [np.mean(label, axis=0) for label in labels]

            self.iteration_data.append({
                "k": iteration,
                "centroids": prev_centroids,
                "new_centroids": centroids,
                "cluster_data": [{ 
                    "distance": distance,
                    "cluster": cluster_of_points[index],
                 } for index, distance in enumerate(distances)]
            })

        self.labels = labels
        self.centroids = centroids
        self.iteration_n = iteration 
        self.labelsInName = labelsInName

    def getPlotData(self):
        return self.init_centroids, self.centroids, self.labels, self.labelsInName

    def toJson(self, additionInfo = {}):
        """ Convert the clustering data trained to json format

            Returns:
                The json format of clustering iteration data
        """

        clusteringData = {
            "init_centroid": self.init_centroids,
            "cluster": self.cluster,
            "iteration_n": self.iteration_n,
            "iterations": self.iteration_data,    
            **additionInfo
        }

        print(clusteringData)

        return json.dumps(clusteringData, cls=json_encoder)
        # return clusteringData
