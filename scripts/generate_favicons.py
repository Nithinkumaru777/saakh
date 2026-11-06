import zlib
import struct

def make_png(width, height, rgba_data):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr)
    png += struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', ihdr_crc)
    
    # IDAT
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        row = rgba_data[y * width * 4 : (y + 1) * width * 4]
        raw.extend(row)
        
    compressed = zlib.compress(bytes(raw), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

# Create a 32x32 image matching Saakh stamp mark
# Background: #17171A (23, 23, 26, 255) with rounded corners (r=6)
# Stamp lines: #F2C12E (242, 193, 46, 255)
W, H = 32, 32
pixels = bytearray(W * H * 4)

def set_pixel(x, y, r, g, b, a=255):
    if 0 <= x < W and 0 <= y < H:
        idx = (y * W + x) * 4
        pixels[idx] = r
        pixels[idx+1] = g
        pixels[idx+2] = b
        pixels[idx+3] = a

# Draw background with rounded corners (rx=6)
for y in range(H):
    for x in range(W):
        # check rounded corner distance
        dx = 0
        if x < 6: dx = 6 - x
        elif x >= W - 6: dx = x - (W - 7)
        
        dy = 0
        if y < 6: dy = 6 - y
        elif y >= H - 6: dy = y - (H - 7)
        
        if dx > 0 and dy > 0:
            dist_sq = dx*dx + dy*dy
            if dist_sq > 36:
                set_pixel(x, y, 0, 0, 0, 0)
                continue
            elif dist_sq > 25:
                # anti-alias edge
                alpha = int(255 * (36 - dist_sq) / 11)
                set_pixel(x, y, 23, 23, 26, alpha)
                continue
        set_pixel(x, y, 23, 23, 26, 255)

# Draw stamp icon inside (Haldi yellow: 242, 193, 46)
GOLD = (242, 193, 46, 255)

def draw_line(x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        set_pixel(x0, y0, *color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy

# Draw handle:
# Top loop at (14..18, 6..9)
draw_line(14, 6, 18, 6, GOLD)
draw_line(13, 7, 13, 9, GOLD)
draw_line(19, 7, 19, 9, GOLD)
draw_line(14, 10, 18, 10, GOLD)
# Vertical post down to base (15..17, 10..17)
for y in range(10, 17):
    set_pixel(15, y, *GOLD)
    set_pixel(16, y, *GOLD)

# Stamp body:
# Top surface of base at y=17 (x: 10..22)
draw_line(10, 17, 22, 17, GOLD)
# Slanted/curved sides down to y=21
draw_line(10, 17, 8, 21, GOLD)
draw_line(22, 17, 24, 21, GOLD)
# Bottom rim of stamp base (x: 8..24 at y=21)
draw_line(8, 21, 24, 21, GOLD)
# Base bottom line at y=25 (x: 9..23)
draw_line(9, 25, 23, 25, GOLD)

png_bytes = make_png(W, H, pixels)

# Write to prototype/favicon.png
with open(r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\prototype\favicon.png', 'wb') as f:
    f.write(png_bytes)

# Also write standard ICO file wrapping the PNG (modern ICO format supports embedded PNG)
ico_header = struct.pack('<HHH', 0, 1, 1)  # reserved 0, type 1 (icon), 1 image
ico_entry = struct.pack('<BBBBHHII', W, H, 0, 0, 1, 32, len(png_bytes), 22)
ico_bytes = ico_header + ico_entry + png_bytes

with open(r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\prototype\favicon.ico', 'wb') as f:
    f.write(ico_bytes)

# Also copy to apps/web/public/
import shutil
shutil.copyfile(r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\prototype\favicon.png', r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\apps\web\public\favicon.png')
shutil.copyfile(r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\prototype\favicon.ico', r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\apps\web\public\favicon.ico')
shutil.copyfile(r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\prototype\favicon.svg', r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2\apps\web\public\favicon.svg')

print('Generated favicon.png, favicon.ico, and copied to apps/web/public')
