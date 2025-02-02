import {
    Button,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { selectAdminState } from '../../reducers/admin/selector';
import { selectAppState } from "../../../common/reducers/app/selector";
import { selectAuthState } from "../../../user/reducers/auth/selector";
import { Router, withRouter } from "next/router";
import { PAGE_LIMIT } from '../../reducers/admin/reducers';
import {
    fetchAdminScenes,
    fetchLocationTypes,
} from '../../reducers/admin/service';
import {
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableSortLabel,
    Paper,
    TablePagination
} from '@material-ui/core';
// @ts-ignore
import styles from './Scenes.module.scss';
import AddToContentPackModel from './AddToContentPackModal';


if (!global.setImmediate) {
    global.setImmediate = setTimeout as any;
}

interface Props {
    router: Router;
    adminState?: any;
    authState?: any;
    locationState?: any;
    fetchAdminScenes?: any;
    fetchLocationTypes?: any;
}

const mapStateToProps = (state: any): any => {
    return {
        appState: selectAppState(state),
        authState: selectAuthState(state),
        adminState: selectAdminState(state)
    };
};

const mapDispatchToProps = (dispatch: Dispatch): any => ({
    fetchAdminScenes: bindActionCreators(fetchAdminScenes, dispatch),
    fetchLocationTypes: bindActionCreators(fetchLocationTypes, dispatch),
});

const Scenes = (props: Props) => {
    const {
        adminState,
        authState,
        fetchAdminScenes,
    } = props;

    const user = authState.get('user');
    const adminScenes = adminState.get('scenes').get('scenes');
    const adminScenesCount = adminState.get('scenes').get('total');
    
    const headCell = [
        { id: 'sid', numeric: false, disablePadding: true, label: 'ID' },
        { id: 'name', numeric: false, disablePadding: false, label: 'Name' },
        { id: 'description', numeric: false, disablePadding: false, label: 'Description' },
        { id: 'addToContentPack', numeric: false, disablePadding: false, label: 'Add to Content Pack'}
    ];

    function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return 1;
        }
        return 0;
    }

    type Order = 'asc' | 'desc';

    function getComparator<Key extends keyof any>(
        order: Order,
        orderBy: Key,
    ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    }

    function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
        const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    }

    interface EnhancedTableProps {
        object: string,
        numSelected: number;
        onRequestSort: (event: React.MouseEvent<unknown>, property) => void;
        onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
        order: Order;
        orderBy: string;
        rowCount: number;
    }

    function EnhancedTableHead(props: EnhancedTableProps) {
        const { object, order, orderBy, onRequestSort } = props;
        const createSortHandler = (property) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property);
        };

        return (
            <TableHead className={styles.thead}>
                <TableRow className={styles.trow}>
                    {headCell.map((headCell) => (
                        <TableCell
                            className={styles.tcell}
                            key={headCell.id}
                            align='right'
                            padding={headCell.disablePadding ? 'none' : 'default'}
                            sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={createSortHandler(headCell.id)}
                            >
                                {headCell.label}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
        );
    }

    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<any>('name');
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_LIMIT);
    const [refetch, setRefetch] = useState(false);
    const [addToContentPackModalOpen, setAddToContentPackModalOpen] = useState(false);
    const [selectedScene, setSelectedScene] = useState({});

    const handleRequestSort = (event: React.MouseEvent<unknown>, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = adminScenes.map((n) => n.name);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        const incDec = page < newPage ? 'increment' : 'decrement';
        fetchAdminScenes(incDec);
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    const openAddToContentPackModal = (scene: any) => {
        setSelectedScene(scene);
        setAddToContentPackModalOpen(true);
    };

    const closeAddToContentPackModal = () => {
        setAddToContentPackModalOpen(false);
        setSelectedScene({});
    };

    const fetchTick = () => {
        setTimeout(() => {
            setRefetch(true);
            fetchTick();
        }, 5000);
    };

    useEffect(() => {
        fetchTick();
    }, []);

    useEffect(() => {
        if (user?.id != null && (adminState.get('scenes').get('updateNeeded') === true || refetch === true)) {
            fetchAdminScenes();
        }
        setRefetch(false);
    }, [authState, adminState, refetch]);

    return (
        <div>
            <Paper className={styles.adminRoot}>
                <TableContainer className={styles.tableContainer}>
                    <Table
                        stickyHeader
                        aria-labelledby="tableTitle"
                        size={'medium'}
                        aria-label="enhanced table"
                    >
                        <EnhancedTableHead
                            object={'scenes'}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={adminScenesCount || 0}
                        />
                        <TableBody className={styles.thead}>
                            {stableSort(adminScenes, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    return (
                                        <TableRow
                                            hover
                                            className={styles.trowHover}
                                            style={{ color: 'black !important' }}
                                            // onClick={(event) => handleLocationClick(event, row.id.toString())}
                                            tabIndex={-1}
                                            key={row.id}
                                        >
                                            <TableCell className={styles.tcell} component="th" id={row.id.toString()}
                                                       align="right" scope="row" padding="none">
                                                {row.sid}
                                            </TableCell>
                                            <TableCell className={styles.tcell} align="right">{row.name}</TableCell>
                                            <TableCell className={styles.tcell}
                                                       align="right">{row.description}</TableCell>
                                            <TableCell className={styles.tcell} align="right">
                                                { user.userRole === 'admin' && <Button
                                                    type="button"
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => openAddToContentPackModal(row)}
                                                >
                                                    Add to Content Pack
                                                </Button> }
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <div className={styles.tableFooter}>
                    <TablePagination
                        rowsPerPageOptions={[PAGE_LIMIT]}
                        component="div"
                        count={adminScenesCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onChangePage={handleChangePage}
                        onChangeRowsPerPage={handleChangeRowsPerPage}
                        className={styles.tablePagination}
                    />
                </div>
                <AddToContentPackModel
                    open={addToContentPackModalOpen}
                    scene={selectedScene}
                    handleClose={closeAddToContentPackModal}
                />
            </Paper>
        </div>
    );
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Scenes));
