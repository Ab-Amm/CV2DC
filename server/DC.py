from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

# Setup Jinja2 env, load template from current working directory
env = Environment(loader=FileSystemLoader('./static'))
template = env.get_template('template.html')

html_out = template.render(data=data)

html_path = 'debug_preview.html'
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_out)

print(f"HTML preview written to: {html_path} — Open it in a browser to check layout and data.")
name = data.get("nom", "unknown").replace(" ", "_")
pdf_path = f"{name}_resume_dc.pdf"

# Generate PDF
HTML(string=html_out).write_pdf(pdf_path)