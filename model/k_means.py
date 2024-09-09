import numpy as np
import json
import pandas as pd

from utils.distance_utils import Distance
from utils.json_encoder import json_encoder

# Finding best number of cluster

class K_Means:
    def __init__ (self, cluster, iteration):
        self.cluster = cluster
        self.iteration = iteration

    def fit(self, data, distance_type, data_name):
        # Random centroid
        centroids = data.sample(n=self.cluster, axis=0).values.tolist()

        self.init_centroid = centroids

        prev_centroids = None
        iteration = 0
        labels = []
        self.iteration_data = []
        distanceFormula = Distance(distance_type).calculate

        while np.not_equal(centroids, prev_centroids).any() and iteration < self.iteration:
            labels = [[] for _ in range(self.cluster)]
            labelsInName = [[] for _ in range(self.cluster)]

            for index, element in enumerate(data.values):
                distance = [distanceFormula(element, centroid) for centroid in centroids]
                centroid_idx = np.argmin(distance)
                labels[centroid_idx].append(element)
                labelsInName[centroid_idx].append(data_name[index])

            iteration += 1
            prev_centroids = centroids
            centroids = [np.mean(label, axis=0) for label in labels]

            self.iteration_data.append({
                "k": iteration,
                "centroids": centroids,
                "labels": labels,
                "labelsInName": labelsInName,
            })

        self.labels = labels
        self.centroids = centroids
        self.iteration_n = iteration 

    def toJson(self, additionInfo = {}):
        """ Convert the clustering data trained to json format

            Returns:
                The json format of clustering iteration data
        """

        clusteringData = {
            "init_centroid": self.init_centroid,
            "cluster": self.cluster,
            "iteration_n": self.iteration_n,
            "iteration": self.iteration_data,    
            **additionInfo
        }

        return json.dumps(clusteringData, cls=json_encoder)
        # return clusteringData
