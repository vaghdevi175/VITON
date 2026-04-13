class SegOptions:
    def __init__(self):
        self.dataset_dir = "./dataset"
        self.dataset_mode = "train"
        self.dataset_list = "train_pairs.txt"

        self.load_height = 1024
        self.load_width = 768

        self.batch_size = 4
        self.workers = 4
        self.shuffle = True

        self.semantic_nc = 13
        self.init_type = "xavier"
        self.init_variance = 0.02

        self.lr = 2e-4
        self.epochs = 70

        self.checkpoint_dir = "./viton/checkpoints"


class GMMOptions:
    def __init__(self):
        # FIX: Changed 'dataroot' to 'dataset_dir' to match VITONDataset expectations
        self.dataset_dir = "./dataset"
        self.dataset_mode = "train"
        self.dataset_list = "train_pairs.txt"

        self.load_height = 1024
        self.load_width = 768

        self.grid_size = 5

        self.batch_size = 4
        self.workers = 4
        self.shuffle = True

        self.lr = 2e-4
        self.epochs = 70

        self.checkpoint_dir = "./checkpoints"

        self.checkpoint = "./checkpoints/gmm_final.pth"
        self.num_upsampling_layers = "most"
        self.ngf = 64
        self.norm_G = "spectralaliasinstance"

        self.semantic_nc = 7
        self.init_type = "xavier"
        self.init_variance = 0.02