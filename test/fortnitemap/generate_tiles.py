import os
from PIL import Image

TILE_SIZE = 256
BASE_ZOOM = 4
OUTPUT_DIR = "tiles"

def generate_lower_zoom():
    for z in range(BASE_ZOOM - 1, 0, -1):
        print(f"生成缩放等级 {z} 的瓦片...")
        z_dir = os.path.join(OUTPUT_DIR, str(z))
        os.makedirs(z_dir, exist_ok=True)
        
        higher_z = z + 1
        tiles_per_side = 2 ** z
        higher_tiles_per_side = 2 ** higher_z
        
        for x in range(tiles_per_side):
            x_dir = os.path.join(z_dir, str(x))
            os.makedirs(x_dir, exist_ok=True)
            
            for y in range(tiles_per_side):
                output_path = os.path.join(x_dir, f"{y}.webp")
                
                new_img = Image.new('RGB', (TILE_SIZE * 2, TILE_SIZE * 2))
                
                for dx in range(2):
                    for dy in range(2):
                        hx = x * 2 + dx
                        hy = y * 2 + dy
                        tile_path = os.path.join(OUTPUT_DIR, str(higher_z), str(hx), f"{hy}.webp")
                        
                        if os.path.exists(tile_path):
                            tile = Image.open(tile_path).convert('RGB')
                            new_img.paste(tile, (dx * TILE_SIZE, dy * TILE_SIZE))
                            tile.close()
                
                resized = new_img.resize((TILE_SIZE, TILE_SIZE), Image.LANCZOS)
                resized.save(output_path, 'WEBP', quality=90)
                resized.close()
                new_img.close()
                
                print(f"  已生成: z={z}, x={x}, y={y}")

if __name__ == "__main__":
    generate_lower_zoom()
    print("完成！")
