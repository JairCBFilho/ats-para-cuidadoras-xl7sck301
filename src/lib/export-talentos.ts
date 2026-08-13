import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Cuidador } from '@/services/cuidadores'
import { parseTags } from '@/services/cuidadores'

/** Retorna a data de hoje no formato YYYY-MM-DD para o nome do arquivo. */
function todayStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Colunas completas exportadas no Excel (todos os campos visíveis do Cuidador). */
const EXCEL_COLUMNS: { header: string; key: keyof Cuidador | 'tags_arr' }[] = [
  { header: 'Nome', key: 'nome' },
  { header: 'E-mail', key: 'email' },
  { header: 'Telefone', key: 'telefone' },
  { header: 'Celular', key: 'celular' },
  { header: 'Disponibilidade', key: 'disponibilidade' },
  { header: 'Turno', key: 'turno' },
  { header: 'Especialidades', key: 'especialidades' },
  { header: 'Formação', key: 'formacao' },
  { header: 'Localização', key: 'localizacao' },
  { header: 'Cidade', key: 'cidade' },
  { header: 'Bairro', key: 'bairro' },
  { header: 'UF', key: 'uf' },
  { header: 'CEP', key: 'cep' },
  { header: 'Endereço', key: 'endereco' },
  { header: 'Origem', key: 'origem' },
  { header: 'Experiência', key: 'experiencia' },
  { header: 'Tempo de experiência', key: 'tempo_experiencia' },
  { header: 'Curso de cuidador', key: 'curso_cuidador' },
  { header: 'Carga horária do curso', key: 'carga_horaria_curso' },
  { header: 'Experiência ILPI', key: 'experiencia_ilp' },
  { header: 'Disponibilidade de horário', key: 'disponibilidade_horario' },
  { header: 'Início imediato', key: 'inicio_imediato' },
  { header: 'Vacina COVID', key: 'vacina_covid' },
  { header: 'Restrição física', key: 'restricao_fisica' },
  { header: 'Outros cursos/experiências', key: 'outros_cursos_experiencias' },
  { header: 'Referências', key: 'referencias' },
  { header: 'LinkedIn', key: 'linkedin' },
  { header: 'Portfolio', key: 'portfolio' },
  { header: 'CPF', key: 'cpf' },
  { header: 'Identidade', key: 'identidade' },
  { header: 'Sexo', key: 'sexo' },
  { header: 'Nascimento', key: 'nascimento' },
  { header: 'Código', key: 'codigo' },
  { header: 'Data de cadastro', key: 'data_cadastro' },
  { header: 'Data de contato', key: 'data_contato' },
  { header: 'Tags', key: 'tags_arr' },
]

/** Gera e baixa um arquivo .xlsx com todos os campos das cuidadoras informadas. */
export function exportCuidadoresExcel(cuidadores: Cuidador[]): void {
  const rows = cuidadores.map((c) => {
    const row: Record<string, string | number> = {}
    for (const col of EXCEL_COLUMNS) {
      if (col.key === 'tags_arr') {
        row[col.header] = parseTags(c.tags).join(', ')
      } else {
        const v = c[col.key]
        row[col.header] = v === undefined || v === null ? '' : String(v)
      }
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  // Larguras de coluna aproximadas
  ws['!cols'] = EXCEL_COLUMNS.map((col) => ({
    wch: Math.min(40, Math.max(12, col.header.length + 4)),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Talentos')
  XLSX.writeFile(wb, `talentos-lazuli-${todayStamp()}.xlsx`)
}

/**
 * Gera e baixa um PDF tabular com nome, email, telefone, cidade,
 * disponibilidade, turno e tags das cuidadoras informadas.
 * Usa a fonte padrão do jsPDF (Helvetica) que suporta caracteres
 * acentuados Latin-1 (ç, ã, õ, é, etc.) presentes no português.
 */
export function exportCuidadoresPDF(cuidadores: Cuidador[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Banco de Talentos — Lazuli ATS', 40, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const today = new Date().toLocaleDateString('pt-BR')
  doc.text(`Exportado em ${today} — ${cuidadores.length} cuidador(a)(s)`, 40, 58)

  const head = [['Nome', 'E-mail', 'Telefone', 'Cidade', 'Disponibilidade', 'Turno', 'Tags']]
  const body = cuidadores.map((c) => [
    c.nome || '',
    c.email || '',
    c.telefone || c.celular || '',
    c.cidade || '',
    c.disponibilidade || '',
    c.turno || '',
    parseTags(c.tags).join(', '),
  ])

  autoTable(doc, {
    head,
    body,
    startY: 74,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 0, 10], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 247, 240] },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 180 },
      2: { cellWidth: 100 },
      3: { cellWidth: 120 },
      4: { cellWidth: 90 },
      5: { cellWidth: 60 },
      6: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      const pageCurrent = data.pageNumber
      doc.setFontSize(8)
      doc.text(
        `Página ${pageCurrent} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 100,
        doc.internal.pageSize.getHeight() - 20,
      )
    },
  })

  doc.save(`talentos-lazuli-${todayStamp()}.pdf`)
}
