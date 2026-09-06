# Sobe um VÍDEO no compositor do Instagram web pelo diálogo nativo "Abrir" (06/09/2026).
# Por que existe: o file_upload da extensão entrega bytes íntegros, mas o File que ele cria
# não é apoiado em disco e o Instagram nunca processa vídeo por ele (imagem funciona).
# A saída é um clique REAL no botão "Selecionar do computador" e o caminho colado no diálogo.
#
# Guardas (regra do Phillip: teclado do sistema só com a máquina ociosa e título conferido):
#   - aborta se houve entrada do usuário nos últimos -MinIdle segundos (conferido ANTES de
#     qualquer tecla nossa — as nossas teclas também zeram o contador de ociosidade);
#   - só clica se a janela em primeiro plano tiver o título da aba (-TabTitle);
#   - só cola/Enter se a janela em primeiro plano for exatamente "Abrir" ou "Open".
#
# Modos:
#   -Mode Activate : traz o Chrome à frente e alterna abas (Ctrl+Tab, máx. 15) até o título casar.
#                    Necessário porque aba OCULTA não abre o menu "Criar" (rAF pausado).
#   -Mode Upload   : clique real em (-X,-Y) de tela, espera "Abrir", cola -Path, Enter.
#
# Coordenadas de tela do botão, calculadas na aba (javascript_tool), com r = rect do botão:
#   X = screenX + (outerWidth - innerWidth*devicePixelRatio)/2 + (r.x + r.width/2)*devicePixelRatio
#   Y = screenY + (outerHeight - innerHeight*devicePixelRatio) + (r.y + r.height/2)*devicePixelRatio
#   (screenshot da extensão liga emulação e altera dpr/innerWidth: leia os valores SEM screenshot antes.)
#
# Exemplo: .\subir-video-ig.ps1 -Mode Activate -TabTitle 'Criar novo post'
#          .\subir-video-ig.ps1 -Mode Upload -X 699 -Y 945 -Path 'C:\...\reel2-ig.mp4'
param(
  [ValidateSet('Activate','Upload')] [string]$Mode = 'Upload',
  [string]$Path,
  [int]$X, [int]$Y,
  [string]$TabTitle = 'Criar novo post',
  [int]$MinIdle = 120
)
Add-Type -AssemblyName Microsoft.VisualBasic; Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class IgWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
  [StructLayout(LayoutKind.Sequential)] public struct LII { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LII p);
  public static string T(){ var sb=new StringBuilder(256); GetWindowText(GetForegroundWindow(),sb,256); return sb.ToString(); }
  public static double Idle(){ var l=new LII(); l.cbSize=(uint)Marshal.SizeOf(l); GetLastInputInfo(ref l); return (Environment.TickCount - l.dwTime)/1000.0; }
  public static void Click(int x,int y){ SetCursorPos(x,y); System.Threading.Thread.Sleep(150); mouse_event(2,0,0,0,UIntPtr.Zero); System.Threading.Thread.Sleep(80); mouse_event(4,0,0,0,UIntPtr.Zero); }
}
"@
$idle = [IgWin]::Idle()
if ($idle -lt $MinIdle) { "ABORT usuario ativo (ocioso ha $([int]$idle)s, minimo $MinIdle)"; exit 2 }

if ($Mode -eq 'Activate') {
  $p = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'Google Chrome' } | Select-Object -First 1
  if (-not $p) { 'ABORT sem janela do Chrome'; exit 3 }
  [Microsoft.VisualBasic.Interaction]::AppActivate($p.Id); Start-Sleep -Milliseconds 600
  $t = [IgWin]::T(); $n = 0
  while ($t -notmatch [regex]::Escape($TabTitle) -and $t -match 'Google Chrome' -and $n -lt 15) {
    [System.Windows.Forms.SendKeys]::SendWait('^{TAB}'); Start-Sleep -Milliseconds 400; $t = [IgWin]::T(); $n++
  }
  if ($t -match [regex]::Escape($TabTitle)) { "OK aba ativa apos $n Ctrl+Tab: $t"; exit 0 }
  "ABORT aba nao encontrada; primeiro plano: $t"; exit 4
}

if (-not (Test-Path -LiteralPath $Path)) { "ABORT arquivo nao existe: $Path"; exit 5 }
$t = [IgWin]::T()
if ($t -notmatch [regex]::Escape($TabTitle)) { "ABORT aba errada em primeiro plano: $t"; exit 4 }
$aberto = $false
for ($tent = 1; $tent -le 2 -and -not $aberto; $tent++) {
  [IgWin]::Click($X, $Y); "clique $tent em ($X,$Y)"
  for ($i = 0; $i -lt 16; $i++) { if ([IgWin]::T() -match '^(Abrir|Open)$') { $aberto = $true; break }; Start-Sleep -Milliseconds 500 }
}
if (-not $aberto) { "ABORT dialogo Abrir nao apareceu; primeiro plano: $([IgWin]::T())"; exit 6 }
Start-Sleep -Milliseconds 800
Set-Clipboard -Value $Path
[System.Windows.Forms.SendKeys]::SendWait('^v'); Start-Sleep -Milliseconds 900
if ([IgWin]::T() -notmatch '^(Abrir|Open)$') { "ABORT dialogo sumiu antes do Enter: $([IgWin]::T())"; exit 7 }
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}'); Start-Sleep -Milliseconds 2500
"OK caminho colado e confirmado; primeiro plano: $([IgWin]::T())"
