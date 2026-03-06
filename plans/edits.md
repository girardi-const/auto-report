products
api/products/{brand}/{code} - GET : return that product that have this code from that brand
api/products/{brand} - GET : get all the products from that brand
api/products/ - POST : Create product receive in the body : code_product, brand_name, price: and image_url
api/product/{brand}/{code} - PUT : Update the product of the code form that brand
api/product/{brand}/{code} - DELETE: Delete the product from that code and brand

reports 
api/reports - GET : return all the reports
api/reports - POST : create a report, get in the body title, creator_id, pdf_file, and the excel_file
api/reports/:id- DELETE : delete one file

