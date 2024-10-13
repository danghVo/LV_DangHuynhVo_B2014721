from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt
import boto3
from io import BytesIO
import numpy as np
import uuid

def generate_random_colors(nums_cluster):
    colors = []
    for _ in range(nums_cluster):
        color = "#{:02x}{:02x}{:02x}".format(
            np.random.randint(0, 128),  # Red
            np.random.randint(0, 128),  # Green
            np.random.randint(0, 128)   # Blue
        )
        colors.append(color)
    return colors

# distance_matrix, linkedMethod, labels
def draw_hierarchical(iterations_data, labels, user_uuid):
    print(labels)
    linkage_matrix = []
    for iteration_data in iterations_data:
        new_cluster = iteration_data["new_cluster"]
        linkage_matrix.append([new_cluster["index_cluster_1"], 
                               new_cluster["index_cluster_2"], 
                               new_cluster["distance"], 
                               new_cluster["total_point"]])

    colors = generate_random_colors(len(linkage_matrix))

    # Plot the dendrogram
    plt.figure(figsize=(10, 7))
    dendrogram(linkage_matrix, labels=labels, link_color_func=lambda k : colors[k % len(linkage_matrix)], leaf_rotation=0)
    plt.title('Hierarchical Clustering Dendrogram')
    plt.xlabel('Cluster')
    plt.ylabel('Distance')

    s3 = boto3.resource('s3')
    
    buffer = BytesIO()
    plt.savefig(buffer, format='jpg')
    buffer.seek(0)

    # Give me random uuid

    object_key = f'hierarchical_{uuid.uuid4()}.jpg'

    s3.Bucket('clustering-graph').put_object(Key=object_key, Body=buffer.getvalue(), ContentType='image/jpg')

    return object_key
    


