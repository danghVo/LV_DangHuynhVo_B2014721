import numpy as np
import pandas as pd
import json

class json_encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            # return pd.Series(obj).to_json(orient='values')
            return np.array(obj).tolist()
        if isinstance(obj, pd.Series):
            return obj.to_list()

        return json.JSONEncoder.default(self, obj)