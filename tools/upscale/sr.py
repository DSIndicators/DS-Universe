"""
Super-resolution with Real-ESRGAN-family models on the CPU (ncnn), tiled.

Used by tools/upscale/upscale.py. Runs in Claude's cloud workspace (Python +
`pip install ncnn`); the models are the ncnn .param/.bin pairs from the
Real-ESRGAN release (xinntao/Real-ESRGAN v0.2.5.0) and Upscayl's model set.

    sr = SR("models/realesrgan-x4plus")      # 4x
    out = sr.run(rgb_uint8_array)           # H*4 x W*4 x 3, uint8

Tiles overlap by PAD pixels on every side and only each tile's centre is kept,
so the seams are invisible; the image edge is reflected so border pixels see
the same context as interior ones.
"""
import ncnn
import numpy as np

TILE = 192
PAD = 16


class SR:
    def __init__(self, stem: str, scale: int = 4, threads: int = 2):
        self.scale = scale
        self.net = ncnn.Net()
        self.net.opt.use_vulkan_compute = False
        self.net.opt.num_threads = threads
        self.net.load_param(stem + ".param")
        self.net.load_model(stem + ".bin")

    def _tile(self, rgb: np.ndarray) -> np.ndarray:
        h, w, _ = rgb.shape
        mat = ncnn.Mat.from_pixels(np.ascontiguousarray(rgb), ncnn.Mat.PixelType.PIXEL_RGB, w, h)
        mat.substract_mean_normalize([0, 0, 0], [1 / 255.0, 1 / 255.0, 1 / 255.0])
        ex = self.net.create_extractor()
        ex.input("data", mat)
        _, out = ex.extract("output")
        a = np.array(out)  # 3 x H x W, 0..1
        return np.clip(a.transpose(1, 2, 0) * 255.0 + 0.5, 0, 255).astype(np.uint8)

    def run(self, rgb: np.ndarray, progress=None) -> np.ndarray:
        h, w, _ = rgb.shape
        s = self.scale
        src = np.pad(rgb, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="reflect")
        out = np.zeros((h * s, w * s, 3), np.uint8)
        ys = list(range(0, h, TILE))
        xs = list(range(0, w, TILE))
        n, k = len(ys) * len(xs), 0
        for y in ys:
            for x in xs:
                th, tw = min(TILE, h - y), min(TILE, w - x)
                tile = src[y : y + th + 2 * PAD, x : x + tw + 2 * PAD]
                up = self._tile(tile)
                out[y * s : (y + th) * s, x * s : (x + tw) * s] = up[PAD * s : (PAD + th) * s, PAD * s : (PAD + tw) * s]
                k += 1
                if progress:
                    progress(k, n)
        return out
