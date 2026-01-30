from PIL import Image, ImageChops
import sys

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    img = Image.open(input_path)
    cropped_img = trim(img)
    cropped_img.save(output_path)
    print(f"Cropped image saved to {output_path}")
