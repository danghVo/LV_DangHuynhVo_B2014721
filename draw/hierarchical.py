from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt
import boto3
from io import BytesIO

def draw_hierarchical(distance_matrix, linkedMethod, labels):
    linkage_matrix = []
    for i, distance_data in enumerate(distance_matrix):
        linkage_matrix.append([i, i + 1, distance_data["distance"], 2])

    # Generate the linkage matrix
    Z = linkage(linkage_matrix, method=linkedMethod)

    # Plot the dendrogram
    plt.figure(figsize=(10, 7))
    dendrogram(Z, labels=labels)
    plt.title('Hierarchical Clustering Dendrogram')
    plt.xlabel('Cluster')
    plt.ylabel('Distance')

    s3 = boto3.resource('s3')
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)

    print(buffer.getbuffer())

    s3.Bucket('clustering-graph').put_object(Key='hierarchical.png', Body=buffer.getbuffer(), ContentType='image/png')