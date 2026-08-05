import re

file_path = r'c:\Users\Chamara\OneDrive\Documents\GitHub\sat\Megakem-Loyalty-app\frontend\src\App.js'

with open(file_path, 'rb') as f:
    raw = f.read()

original = raw

def show_context(raw, pattern, context=100):
    idx = raw.find(pattern)
    if idx == -1:
        return "NOT FOUND"
    return repr(raw[max(0,idx-20):idx+len(pattern)+20])

# All patterns will be done in bytes to avoid encoding issues
fixes = []

# Fix 1: Default tab fallback
old1 = b"else if (hasPermission('canManageApplicators')) setAdminTab('applicator-program');\r\n        else if (hasPermission('canManageApplicators')) setAdminTab('applicator');"
new1 = b"else if (hasPermission('canManageApplicators')) setAdminTab('applicator');\r\n        else if (hasPermission('canManageApplicatorProgram')) setAdminTab('applicator-program');"
print("Fix 1:", show_context(raw, old1))
if old1 in raw:
    raw = raw.replace(old1, new1, 1)
    print("Fix 1 APPLIED")

# Fix 3: Main admin permission chips - add Insights, Appl.Program, Audit Logs, Feedbacks
old3 = b"<Chip label='Applicators' size='small' color='primary' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />\r\n                          <Chip label='Delete' size='small' color='error'"
new3 = (b"<Chip label='Applicators' size='small' color='primary' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />\r\n"
        b"                          <Chip label='Appl. Program' size='small' color='secondary' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />\r\n"
        b"                          <Chip label='Audit Logs' size='small' color='error' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />\r\n"
        b"                          <Chip label='Feedbacks' size='small' color='info' sx={{ fontSize: '0.7rem', fontWeight: 600 }} />\r\n"
        b"                          <Chip label='Delete' size='small' color='error'")
print("Fix 3:", show_context(raw, old3))
if old3 in raw:
    raw = raw.replace(old3, new3, 1)
    print("Fix 3 APPLIED")

# Fix 4: Co-admin chips - add Appl. Program chip
old4 = b"canManageApplicators === true && <Chip label='Applicators' size='small' color='primary' variant='outlined' sx={{ fontSize: '0.7rem' }} />}\r\n                          {u.permissions?.canViewAuditLogs"
new4 = (b"canManageApplicators === true && <Chip label='Applicators' size='small' color='primary' variant='outlined' sx={{ fontSize: '0.7rem' }} />}\r\n"
        b"                          {u.permissions?.canManageApplicatorProgram === true && <Chip label='Appl. Program' size='small' color='secondary' variant='outlined' sx={{ fontSize: '0.7rem' }} />}\r\n"
        b"                          {u.permissions?.canViewAuditLogs")
print("Fix 4:", show_context(raw, old4))
if old4 in raw:
    raw = raw.replace(old4, new4, 1)
    print("Fix 4 APPLIED")

# Fix 5: Edit dialog - add canManageApplicatorProgram 
old5 = b"canManageApplicators: u.permissions?.canManageApplicators === true,\r\n                              canViewAuditLogs: u.permissions?.canViewAuditLogs === true,"
new5 = (b"canManageApplicators: u.permissions?.canManageApplicators === true,\r\n"
        b"                              canManageApplicatorProgram: u.permissions?.canManageApplicatorProgram === true,\r\n"
        b"                              canViewAuditLogs: u.permissions?.canViewAuditLogs === true,")
print("Fix 5:", show_context(raw, old5))
if old5 in raw:
    raw = raw.replace(old5, new5, 1)
    print("Fix 5 APPLIED")

# Fix 6: New user dialog default permissions
old6 = b"canManageApplicators: false,\r\n                      canViewAuditLogs: false,"
new6 = (b"canManageApplicators: false,\r\n"
        b"                      canManageApplicatorProgram: false,\r\n"
        b"                      canViewAuditLogs: false,")
print("Fix 6:", show_context(raw, old6))
if old6 in raw:
    raw = raw.replace(old6, new6, 1)
    print("Fix 6 APPLIED")

# Fix 7: Add Applicator Program switch in permissions dialog (after Applicators switch, before Audit Logs)
old7 = (b"                    color='info' \r\n"
        b"                  />\r\n"
        b"                </Box>\r\n"
        b"\r\n"
        b"                {/* Audit Logs */}")
new7 = (b"                    color='info' \r\n"
        b"                  />\r\n"
        b"                </Box>\r\n"
        b"\r\n"
        b"                {/* 10b. Applicator Program */}\r\n"
        b"                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>\r\n"
        b"                  <Box>\r\n"
        b"                    <Typography variant='body2' fontWeight={600}>Can Access Applicator Program</Typography>\r\n"
        b"                    <Typography variant='caption' color='text.secondary'>Access permission for the Applicator Program tab</Typography>\r\n"
        b"                  </Box>\r\n"
        b"                  <Switch \r\n"
        b"                    checked={userDialog.user?.permissions?.canManageApplicatorProgram === true} \r\n"
        b"                    onChange={(e) => {\r\n"
        b"                      const checked = e.target.checked;\r\n"
        b"                      setUserDialog(prev => ({ \r\n"
        b"                        ...prev, \r\n"
        b"                        user: { \r\n"
        b"                          ...prev.user, \r\n"
        b"                          permissions: { ...(prev.user?.permissions || {}), canManageApplicatorProgram: checked } \r\n"
        b"                        } \r\n"
        b"                      }));\r\n"
        b"                    }} \r\n"
        b"                    color='secondary' \r\n"
        b"                  />\r\n"
        b"                </Box>\r\n"
        b"\r\n"
        b"                {/* Audit Logs */}")
# This pattern is too generic - let's find specifically within the applicator section
# Find the one near the Applicator & Hardware section
idx = raw.find(b"canManageApplicators: checked }")
if idx != -1:
    # Find the next "Audit Logs" comment after this
    audit_idx = raw.find(b"{/* Audit Logs */}", idx)
    if audit_idx != -1:
        # Find the closing </Box> just before it
        close_box = raw.rfind(b"</Box>\r\n\r\n                {/* Audit Logs */}", idx, audit_idx + 50)
        if close_box != -1:
            insert_pos = close_box + len(b"</Box>\r\n\r\n")
            before = raw[:insert_pos]
            after = raw[insert_pos:]
            new_block = (b"                {/* 10b. Applicator Program */}\r\n"
                b"                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>\r\n"
                b"                  <Box>\r\n"
                b"                    <Typography variant='body2' fontWeight={600}>Can Access Applicator Program</Typography>\r\n"
                b"                    <Typography variant='caption' color='text.secondary'>Access permission for the Applicator Program tab</Typography>\r\n"
                b"                  </Box>\r\n"
                b"                  <Switch \r\n"
                b"                    checked={userDialog.user?.permissions?.canManageApplicatorProgram === true} \r\n"
                b"                    onChange={(e) => {\r\n"
                b"                      const checked = e.target.checked;\r\n"
                b"                      setUserDialog(prev => ({ \r\n"
                b"                        ...prev, \r\n"
                b"                        user: { \r\n"
                b"                          ...prev.user, \r\n"
                b"                          permissions: { ...(prev.user?.permissions || {}), canManageApplicatorProgram: checked } \r\n"
                b"                        } \r\n"
                b"                      }));\r\n"
                b"                    }} \r\n"
                b"                    color='secondary' \r\n"
                b"                  />\r\n"
                b"                </Box>\r\n"
                b"\r\n")
            raw = before + new_block + after
            print("Fix 7 APPLIED: Applicator Program switch inserted in dialog")
        else:
            print("Fix 7: Could not find insertion point")
    else:
        print("Fix 7: Audit Logs comment not found after applicator section")
else:
    print("Fix 7: canManageApplicators: checked not found")

if raw != original:
    with open(file_path, 'wb') as f:
        f.write(raw)
    print("\nAll fixes written to file successfully!")
else:
    print("\nNo changes made.")
