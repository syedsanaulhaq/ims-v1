# Fix VS Code Terminal to Use PowerShell Instead of WSL

## Quick Fix - Via Command Palette:
1. Press `Ctrl + Shift + P`
2. Type: `Terminal: Select Default Profile`
3. Choose `PowerShell` or `Command Prompt`

## Alternative - Via Settings:
1. Press `Ctrl + ,` (open settings)
2. Search: `terminal.integrated.defaultProfile.windows`
3. Change from `WSL` to `PowerShell`

## Manual Settings.json Fix:
Add this to your VS Code settings.json:
```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

## After Changing Terminal:
1. Close any open terminals
2. Open new terminal (`Ctrl + Shift + `` `)
3. Navigate to project: `cd e:\ECP-Projects\inventory-management-system-ims`
4. Restart backend: `node backend-server.cjs`

This will run the server in Windows environment instead of WSL.
