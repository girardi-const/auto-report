import fitz  # PyMuPDF
import os

# Open the PDF
pdf_path = "ORÇA. EMANUELA. ARQ VANESSA FINCO.pdf"
output_dir = "frontend/public/extracted"

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Open PDF
doc = fitz.open(pdf_path)

print(f"PDF has {len(doc)} pages")

# Extract images from all pages
image_count = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    
    print(f"\nPage {page_num + 1}: Found {len(image_list)} images")
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Save image
        image_filename = f"{output_dir}/page{page_num + 1}_img{img_index + 1}.{image_ext}"
        with open(image_filename, "wb") as img_file:
            img_file.write(image_bytes)
        
        print(f"  Saved: {image_filename}")
        image_count += 1

print(f"\nTotal images extracted: {image_count}")

# Also render first page as high-res image to capture layout
print("\nRendering first page as reference...")
page = doc[0]
pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
pix.save(f"{output_dir}/page1_full.png")
print(f"Saved: {output_dir}/page1_full.png")

doc.close()
print("\nExtraction complete!")
