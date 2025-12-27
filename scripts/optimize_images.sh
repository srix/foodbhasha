#!/bin/bash

# Navigate to the img directory
cd img || exit

# Create a list of png files
for img in *.png; do
    if [ -f "$img" ]; then
        filename=$(basename -- "$img")
        filename="${filename%.*}"
        
        echo "Processing $img..."
        
        # Convert to webp and resize
        # -resize 400x> : resize to width 400px only if larger, maintain aspect ratio
        # -quality 80 : decent quality
        convert "$img" -resize 400x\> -quality 80 -define webp:lossless=false "${filename}.webp"
        
        if [ $? -eq 0 ]; then
            echo "Created ${filename}.webp"
            # Remove original if successful
            rm "$img"
        else
            echo "Failed to convert $img"
        fi
    fi
done

echo "Optimization complete."
