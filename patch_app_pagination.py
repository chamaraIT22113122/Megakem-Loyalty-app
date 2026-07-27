import re

with open('frontend/src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the scans grid rendering
old_grid = r'{filteredScans\.slice\(0, indexOfLastScan\)\.map\(item => \('
new_grid = r'{paginatedScans.map(item => ('
content = re.sub(old_grid, new_grid, content)

# Replace 'hasMore' button with TablePagination
old_hasmore_regex = r'\{hasMore && \(\s*<Box sx=\{\{ mt: 3, display: \'flex\', justifyContent: \'center\' \}\}>\s*<Button\s*variant=\'outlined\'\s*size=\'medium\'\s*onClick=\{\(\) => setCurrentPage\(prev => prev \+ 1\)\}\s*sx=\{\{.*?\}\}\s*>\s*Load More\s*</Button>\s*</Box>\s*\)\}'
new_pagination = """
<TablePagination
  component="div"
  count={serverScanTotal}
  page={serverScanPage}
  onPageChange={(e, newPage) => setServerScanPage(newPage)}
  rowsPerPage={serverScanRowsPerPage}
  onRowsPerPageChange={(e) => { setServerScanRowsPerPage(parseInt(e.target.value, 10)); setServerScanPage(0); }}
  rowsPerPageOptions={[10, 25, 50, 100]}
/>
"""
content = re.sub(old_hasmore_regex, new_pagination, content, flags=re.DOTALL)

with open('frontend/src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
