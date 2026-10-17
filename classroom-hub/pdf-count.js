import { countText, extractText } from './pdf-metrics.mjs';
const $ = id => document.getElementById(id);
const input = $('pdf-file');
let pdfjs, generation = 0, task = null;
const format = n => n.toLocaleString('ko-KR');
async function reset() {
  generation++;
  const run = generation;
  const old = task; task = null;
  input.value = ''; $('results').hidden = true; $('error').hidden = true;
  $('progress').hidden = true; $('page-rows').replaceChildren(); $('file-name').textContent = '';
  for (const id of ['with-spaces', 'without-spaces', 'page-count']) $(id).textContent = '0';
  $('status').textContent = 'PDF 파일을 선택해 주세요.';
  if (old) { try { await old.destroy(); } catch {} }
  return run;
}
async function analyze(file) {
  const run = await reset();
  if (run !== generation) return;
  if (!pdfjs || !file) return;
  const fail = message => { $('error').textContent = message; $('error').hidden = false; $('status').textContent = ''; };
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return fail('PDF 파일을 선택해 주세요.');
  if (file.size > 50 * 1024 * 1024) return fail('50MB 이하의 PDF를 선택해 주세요.');
  if (!file.size) return fail('파일이 비어 있습니다. 다른 PDF를 선택해 주세요.');
  let currentTask;
  try {
    $('status').textContent = '내 컴퓨터에서 PDF를 읽고 있습니다…';
    const data = new Uint8Array(await file.arrayBuffer());
    if (run !== generation) return;
    currentTask = pdfjs.getDocument({ data, isEvalSupported: false, cMapUrl: './vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: './vendor/pdfjs/standard_fonts/', wasmUrl: './vendor/pdfjs/wasm/', useSystemFonts: true });
    task = currentTask;
    const doc = await currentTask.promise;
    if (run !== generation) return;
    $('progress').max = doc.numPages; $('progress').value = 0; $('progress').hidden = false;
    let withSpaces = 0, withoutSpaces = 0, empty = 0;
    const rows = document.createDocumentFragment();
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      if (run !== generation) return;
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      if (run !== generation) return;
      const count = countText(extractText(content.items));
      withSpaces += count.withSpaces; withoutSpaces += count.withoutSpaces;
      if (!count.withoutSpaces) empty++;
      const row = document.createElement('tr');
      for (const value of [`${pageNum}쪽`, `${format(count.withSpaces)}자`, `${format(count.withoutSpaces)}자`]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      rows.append(row); page.cleanup();
      $('status').textContent = `${doc.numPages}쪽 중 ${pageNum}쪽 분석 중…`;
      $('progress').value = pageNum;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (run !== generation) return;
    $('file-name').textContent = file.name;
    $('with-spaces').textContent = format(withSpaces); $('without-spaces').textContent = format(withoutSpaces);
    $('page-count').textContent = format(doc.numPages); $('page-rows').replaceChildren(rows);
    $('scan-notice').hidden = !empty;
    $('scan-notice').textContent = `${empty}쪽에서 텍스트를 찾지 못했습니다. 빈 페이지이거나 스캔 이미지일 수 있습니다. 해당 페이지의 이미지 속 글자는 결과에 포함되지 않습니다.`;
    $('results').hidden = false; $('status').textContent = '분석 완료 · 파일과 결과는 외부로 전송되지 않았습니다.';
  } catch (error) {
    if (run !== generation) return;
    fail(error.name === 'PasswordException' ? '암호가 설정된 PDF입니다. 암호를 해제한 사본을 선택해 주세요.' : 'PDF를 읽지 못했습니다. 손상되었거나 지원되지 않는 파일일 수 있습니다.');
  } finally {
    if (run === generation) $('progress').hidden = true;
    if (currentTask && task === currentTask) { task = null; try { await currentTask.destroy(); } catch {} }
  }
}
input.addEventListener('change', () => analyze(input.files[0]));
$('clear').addEventListener('click', reset);
const drop = $('drop-zone');
for (const event of ['dragenter', 'dragover']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.add('drag-over'); });
for (const event of ['dragleave', 'drop']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.remove('drag-over'); });
drop.addEventListener('drop', e => {
  if (!pdfjs) return;
  if (e.dataTransfer.files.length !== 1) { $('error').textContent = '한 번에 PDF 파일 하나를 넣어 주세요.'; $('error').hidden = false; return; }
  analyze(e.dataTransfer.files[0]);
});
try {
  pdfjs = await import('./vendor/pdfjs/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.mjs';
  input.disabled = false; $('status').textContent = 'PDF 파일을 선택해 주세요.';
} catch { $('status').textContent = '도구를 불러오지 못했습니다. 로컬 서버로 열어 주세요. (node server.cjs)'; }
