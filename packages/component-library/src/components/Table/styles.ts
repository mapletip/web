/*
 * Table-only stylesheets: DataTable's own CSS and the skin that maps it onto
 * MapleTip tokens. Importing them from the component instead of the global
 * entry keeps them out of bundles that never render a table.
 *
 * Layer order is declared in `src/styles.css`, which every consumer loads, so
 * these rules land in `mantine-datatable` and `mapletip.datatable` no matter
 * when the table chunk arrives.
 */
import 'mantine-datatable/styles.layer.css';
import './datatable.css';
