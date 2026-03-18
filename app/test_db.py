from pymongo import MongoClient

client = MongoClient(
"mongodb+srv://admin:admin123@cluster0.ovje4uh.mongodb.net/virtual_tryon?retryWrites=true&w=majority&appName=Cluster0"
)

db = client["virtual_tryon"]

print("MongoDB connected successfully!")