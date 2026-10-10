import os
from PIL import Image

def process_media_file(original_path: str, thumbnail_dest_dir: str):
    """
    Opens media file, extracts metadata, creates 250x250 thumbnail,
    and returns metadata dictionary.
    """
    os.makedirs(thumbnail_dest_dir, exist_ok=True)
    
    with Image.open(original_path) as img:
        width, height = img.size
        img_format = img.format or "UNKNOWN"
        mode = img.mode

        # Generate thumbnail preserving aspect ratio
        thumb = img.copy()
        thumb.thumbnail((250, 250), Image.Resampling.LANCZOS)
        
        base_name = os.path.basename(original_path)
        thumb_filename = f"thumb_{base_name}"
        if not thumb_filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            thumb_filename += ".png"
            
        thumb_path = os.path.join(thumbnail_dest_dir, thumb_filename)
        
        # Save as PNG if RGBA, else JPEG or original
        if thumb.mode in ("RGBA", "P"):
            thumb.save(thumb_path, format="PNG")
        else:
            thumb.save(thumb_path, format="JPEG", quality=85)

        return {
            "width": width,
            "height": height,
            "format": img_format,
            "color_mode": mode,
            "thumbnail_filename": thumb_filename
        }
