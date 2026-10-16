// Convierte cada página de un PDF en PNG con PDFKit (viene con macOS).
// Uso: swift pdf2png.swift ficha.pdf salida   → salida-p1.png, salida-p2.png…

import PDFKit
import AppKit
let args = CommandLine.arguments
guard args.count == 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("No es un PDF legible (¿la descarga trajo una página HTML?). Uso: swift pdf2png.swift ficha.pdf salida\n".data(using: .utf8)!)
  exit(1)
}
for i in 0..<doc.pageCount {
  let page = doc.page(at: i)!
  let r = page.bounds(for: .mediaBox)
  let scale: CGFloat = 1600 / max(r.width, r.height)
  let img = page.thumbnail(of: NSSize(width: r.width*scale, height: r.height*scale), for: .mediaBox)
  let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(args[2])-p\(i+1).png"))
}
