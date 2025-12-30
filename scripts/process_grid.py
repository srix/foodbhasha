import sys
from PIL import Image

def slice_grid(image_path, output_paths):
    try:
        img = Image.open(image_path)
        width, height = img.size
        
        # Assume 2x2 grid
        mid_x = width // 2
        mid_y = height // 2
        
        # Define crops: (left, top, right, bottom)
        crops = [
            (0, 0, mid_x, mid_y),       # Top-Left
            (mid_x, 0, width, mid_y),   # Top-Right
            (0, mid_y, mid_x, height),  # Bottom-Left
            (mid_x, mid_y, width, height) # Bottom-Right
        ]
        
        if len(output_paths) > 4:
            print("Warning: More than 4 output paths provided, ignoring extras.")
            
        # Inset to remove grid lines (e.g., 15 pixels from each side of the slice)
        inset = 15
            
        for i, crop_box in enumerate(crops):
            if i >= len(output_paths):
                break
            
            output_path = output_paths[i]
            if output_path == "SKIP":
                continue
                
            cropped = img.crop(crop_box)
            
            # Apply inset trim to remove borders/grid lines
            cw, ch = cropped.size
            if cw > (2 * inset) and ch > (2 * inset):
                cropped = cropped.crop((inset, inset, cw - inset, ch - inset))
            
            # Resize to 400x400 as per user desire
            cropped = cropped.resize((400, 400), Image.Resampling.LANCZOS)
            
            cropped.save(output_path, "WEBP", quality=90)
            print(f"Saved {output_path}")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 process_grid.py <input_image> <out1> <out2> <out3> <out4>")
        sys.exit(1)
        
    input_image = sys.argv[1]
    output_files = sys.argv[2:]
    
    slice_grid(input_image, output_files)
