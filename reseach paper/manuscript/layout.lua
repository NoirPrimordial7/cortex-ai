local function stringify(blocks)
  return pandoc.write(pandoc.Pandoc(blocks), "latex"):gsub("%s+$", "")
end

local review_format

function Meta(meta)
  review_format = pandoc.utils.stringify(meta["review-format"] or "")
end

function Image(image)
  if FORMAT:match("latex") then
    image.src = image.src:gsub("%.png$", ".pdf")
    return image
  end
end

function Table(tbl)
  if not FORMAT:match("latex") then
    return nil
  end
  local caption = stringify(tbl.caption.long)
  local cols = #tbl.colspecs
  local widths = cols == 3 and {".24", ".48", ".17"} or {".22", ".28", ".18", ".22"}
  local spec, rows = {}, {}
  for idx=1,cols do
    spec[idx] = ">{\\raggedright\\arraybackslash}p{" .. widths[idx] .. "\\linewidth}"
  end
  local function row(r, header)
    local values = {}
    for _, cell in ipairs(r.cells) do
      local body = stringify(cell.contents)
      values[#values+1] = header and "\\textbf{" .. body .. "}" or body
    end
    rows[#rows+1] = table.concat(values, " & ") .. " \\\\"
  end
  for _, r in ipairs(tbl.head.rows) do row(r, true) end
  rows[#rows+1] = "\\midrule"
  for _, body in ipairs(tbl.bodies) do
    for _, r in ipairs(body.body) do row(r, false) end
  end
  return pandoc.RawBlock("latex", table.concat({
    "\\begin{table}[!htbp]", "\\caption{" .. caption .. "}\\centering\\small",
    "\\begin{tabular}{@{}" .. table.concat(spec) .. "@{}}\\toprule",
    table.concat(rows, "\n"), "\\bottomrule\\end{tabular}", "\\end{table}"
  }, "\n"))
end

local function print_figure(fig)
  if not FORMAT:match("latex") or review_format ~= "ieee" then
    return nil
  end
  fig = fig:walk({Image = function(img)
    img.attributes.width = "67%"
    return img
  end})
  local latex = stringify({fig})
  latex = latex:gsub("\\begin{figure}", "\\begin{figure*}[!t]", 1)
  latex = latex:gsub("\\end{figure}", "\\end{figure*}", 1)
  return pandoc.RawBlock("latex", latex)
end

local function table_reference(inlines)
  if review_format ~= "ieee" then
    return nil
  end
  for i = 3, #inlines do
    if inlines[i - 2].text == "Table" and inlines[i - 1].tag == "Space"
       and inlines[i].text == "1" then
      inlines[i].text = "I"
    end
  end
  return inlines
end

return {
  {Meta = Meta, Image = Image, Table = Table},
  {Figure = print_figure, Inlines = table_reference}
}
