<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class HealthReportExport implements FromView, ShouldAutoSize, WithEvents
{
    private $type;
    private $data;
    private $filters;
    private $adminName;
    private $dateGenerated;

    public function __construct($type, $data, $filters, $adminName, $dateGenerated)
    {
        $this->type = $type;
        $this->data = $data;
        $this->filters = $filters;
        $this->adminName = $adminName;
        $this->dateGenerated = $dateGenerated;
    }

    public function view(): View
    {
        return view("reports.pdf.{$this->type}", [
            'data' => $this->data,
            'filters' => $this->filters,
            'adminName' => $this->adminName,
            'dateGenerated' => $this->dateGenerated,
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Add default styling for standard tables
                // Assuming data starts at row 7 based on common report headers
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                
                // Style header row (assuming row 7 is table header)
                $sheet->getStyle("A7:{$highestColumn}7")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['argb' => 'FFFFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FF1E3A8A'], // Deep Blue
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFCBD5E1'],
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Style data rows
                if ($highestRow > 7) {
                    $sheet->getStyle("A8:{$highestColumn}{$highestRow}")->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['argb' => 'FFCBD5E1'],
                            ],
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);
                }
            },
        ];
    }
}
