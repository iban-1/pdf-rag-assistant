"""Generates a minimal hand-built 2-page PDF for manual testing (no reportlab dependency)."""

import pathlib


def make_pdf(pages_text: list[str]) -> bytes:
    objects = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{3 + 2 * i} 0 R" for i in range(len(pages_text)))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages_text)} >>".encode())

    body_objects = [objects[0], objects[1]]
    for i, text in enumerate(pages_text):
        page_num = 3 + 2 * i
        content_num = page_num + 1
        stream = f"BT /F1 14 Tf 50 750 Td ({text}) Tj ET".encode()
        page_obj = (
            f"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 {3 + 2 * len(pages_text)} 0 R >> >> "
            f"/MediaBox [0 0 612 792] /Contents {content_num} 0 R >>"
        ).encode()
        content_obj = f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream"
        body_objects.append(page_obj)
        body_objects.append(content_obj)

    font_obj = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    body_objects.append(font_obj)

    pdf = b"%PDF-1.4\n"
    offsets = [0]
    for i, obj in enumerate(body_objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"

    xref_start = len(pdf)
    n = len(body_objects) + 1
    pdf += f"xref\n0 {n}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        pdf += f"{off:010d} 00000 n \n".encode()
    pdf += f"trailer\n<< /Size {n} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode()
    return pdf


if __name__ == "__main__":
    text_p1 = "The capital of Wakanda is Birnin Zana."
    text_p2 = "Wakanda's primary natural resource is vibranium."
    pdf_bytes = make_pdf([text_p1, text_p2])
    out_path = pathlib.Path(__file__).parent / "test.pdf"
    out_path.write_bytes(pdf_bytes)
    print(f"wrote {out_path} ({len(pdf_bytes)} bytes)")
