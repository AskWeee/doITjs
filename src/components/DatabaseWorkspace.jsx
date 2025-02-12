import React, {Fragment} from 'react'
import './DatabaseWorkspace.scss'
import GCtx from "../GCtx";
import lodash from "lodash";
import axios from "axios";
import moment from 'moment';
import {Button, Select, Tree, Table, Input, Tabs, Checkbox, Form, Tooltip, Radio} from 'antd'
import {
    CaretDownOutlined,
    CaretLeftOutlined,
    CaretRightOutlined,
    PlusSquareOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons'
import {Graph, Addon, Shape, DataUri} from "@antv/x6";
import KColumnTitle from "./KColumnTitle";
import TadTable from "../entity/TadTable";
import TadTableColumn from '../entity/TadTableColumn'
import TadTableIndex from "../entity/TadTableIndex";
import TadTableIndexColumn from "../entity/TadTableIndexColumn";
import TadTablePartition from "../entity/TadTablePartition";
import TadTableRelation from "../entity/TadTableRelation";
import EditableCellTool from "./EditableCellTool";
import TadTableEr from "../entity/TadTableEr";
import TadTableErTree from "../entity/TadTableErTree";
import TadTableErTable from "../entity/TadTableErTable";
import TadDbConnection from "../entity/TadDbConnection";

const {TabPane} = Tabs;
const {Stencil} = Addon;
const {Rect} = Shape;

export default class DatabaseWorkspace extends React.Component {
    static contextType = GCtx;

    x6Graph = null;
    x6Stencil = null;

    gUi = {};
    gMap = {
        erTables: new Map()
    };
    gData = {};
    gCurrent = {
        productLineId: undefined,
        productId: undefined,
        moduleId: undefined,
        dbUserId: undefined,
        productsNodeSelectedType: undefined,
        letterSelected: undefined,
        tableId: undefined,
        dbTarget: {
            connectionId: undefined
        }
    };
    gDynamic = {
        entities: new Map(),
    };
    gRef = {
        boxTableColumns: React.createRef(),
        treeProducts: React.createRef(),
        treeTableFirstLetters: React.createRef(),
        treeTables: React.createRef(),
        treeTableFirstLetters4ErDiagram: React.createRef(),
        treeTables4ErDiagram: React.createRef(),
        treeErDiagrams: React.createRef(),
        x6StencilContainerBox: React.createRef(),
        x6GraphContainerBox: React.createRef(),
        x6GraphContainer: React.createRef(),
        selectDbUser: React.createRef(),
    }
    x6Data = {
        tables: [],
        relations: []
    }

    constructor(props) {
        super(props);

        //todo >>>>> state
        this.state = {
            isErDiagram: true,
            tabNavSelected: "tabNavTwo",
            nodeType: "unknown",
            treeSelectedKeysProducts: [],
            treeExpandedKeysProducts: [],
            productLineDbUserId: -1,
            treeSelectedKeysTableFirstLetters: [],
            treeSelectedKeysTables: [],
            radioDataSource: 1,
            lettersUnknownTreeData: [],

            dbUsersSelectOptions: [{value: -1, label: "请选择产品线数据库用户"}],
            connectionsSelectOptions: [{value: -1, label: "请选择来源数据库"}],
            connectionsSelected: -1,
            dbUserSelected: -1,
            treeDataProducts: [],
            treeDataLettersKnown: [],
            treeDataTablesKnown: [],
            dsColumns: [],
            dsIndexes: [],
            dsPartitions: [],
            dsRelations: [],
            dsRecords: [],
            recordsDynamic: [],
            columnsDynamic: [],
            tableSql: "",
            domTableSql: [],
            pageSizeColumns: 0,
            pageSizeIndexes: 0,
            pageSizePartitions: 0,
            pageSizeRelations: 0,
            pageSizeRecords: 0,
            isShownButtonAddColumn: "block",
            isShownButtonDeleteColumn: "block",
            isShownButtonAlterColumnConfirm: "none",
            isShownButtonAlterColumnCancel: "none",
            isShownButtonAddIndex: "block",
            isShownButtonDeleteIndex: "block",
            isShownButtonAlterIndexConfirm: "none",
            isShownButtonAlterIndexCancel: "none",
            isShownButtonAddPartition: "block",
            isShownButtonDeletePartition: "block",
            isShownButtonAlterPartitionConfirm: "none",
            isShownButtonAlterPartitionCancel: "none",
            isShownButtonAddRelation: "block",
            isShownButtonDeleteRelation: "block",
            isShownButtonAlterRelationConfirm: "none",
            isShownButtonAlterRelationCancel: "none",
            isShownButtonAddRecord: "block",
            isShownButtonDeleteRecord: "block",
            isShownButtonAlterRecordConfirm: "none",
            isShownButtonAlterRecordCancel: "none",
            isEditingKeyColumn: -1,
            isEditingKeyIndex: -1,
            isEditingKeyPartition: -1,
            isEditingKeyRelation: -1,
            isEditingKeyData: -1,
            editingColumn: {
                key: -1,
                column_id: -1,
                table_id: -1,
                name: "",
                data_type: "",
                data_length: -1,
                data_default: "",
                nullable_flag: "",
                primary_flag: "",
                split_flag: "",
                repeat_flag: "",
                desc: ""
            },
            editingIndex: {
                key: -1,
                id: -1,
                table_id: -1,
                name: "",
                type: "",
                columns: "",
                attributes: "",
                desc: ""
            },
            editingPartition: {
                key: -1,
                id: -1,
                table_id: -1,
                type: "",
                column: -1,
                name: "",
                operator: "",
                expression: "",
                tablespace: "",
                desc: ""
            },
            editingRelation: {
                key: -1,
                id: -1,
                type: "",
                s_db_user_id: -1,
                s_table_id: -1,
                s_column_id: -1,
                a_db_user_id: -1,
                a_table_id: -1,
                a_column_id: -1,
                data_flow: "",
                desc: ""
            },
            styleLayout: "NNN",
            tablePropertiesScrollX: 1366,
            tablePropertiesScrollY: 400,
            isTableNameEditing: false,
            tableColumnEditingKey: null,
            isTableErTreeEditing: false,
            treeDataTableErs: [],
        }

        //todo >>>>> bind
        this.doInit = this.doInit.bind(this);

        this.restGetTableRelations = this.restGetTableRelations.bind(this);
        this.restGetTableRelation = this.restGetTableRelation.bind(this);
        this.restAddTableRelation = this.restAddTableRelation.bind(this);
        this.restUpdateTableRelation = this.restUpdateTableRelation.bind(this);
        this.restDeleteTableRelation = this.restDeleteTableRelation.bind(this);
        this.restTestTableRelation = this.restTestTableRelation.bind(this);
        this.doGetTableRelations = this.doGetTableRelations.bind(this);
        this.doGetTableRelation = this.doGetTableRelation.bind(this);
        this.doAddTableRelation = this.doAddTableRelation.bind(this);
        this.doUpdateTableRelation = this.doUpdateTableRelation.bind(this);
        this.doDeleteTableRelation = this.doDeleteTableRelation.bind(this);
        this.doTestTableRelation = this.doTestTableRelation.bind(this);

        this.restGetTableErTables = this.restGetTableErTables.bind(this);
        this.restAddTableErTable = this.restAddTableErTable.bind(this);
        this.restUpdateTableErTable = this.restUpdateTableErTable.bind(this);
        this.restDeleteTableErTable = this.restDeleteTableErTable.bind(this);
        this.doGetTableErTables = this.doGetTableErTables.bind(this);
        this.doAddTableErTable = this.doAddTableErTable.bind(this);
        this.doUpdateTableErTable = this.restUpdateTableErTable.bind(this);
        this.doDeleteTableErTable = this.doDeleteTableErTable.bind(this);

        this.restAddTable = this.restAddTable.bind(this);
        this.restUpdateTable = this.restUpdateTable.bind(this);
        this.restDeleteTable = this.restDeleteTable.bind(this);
        this.restAddTableColumn = this.restAddTableColumn.bind(this);
        this.restUpdateTableColumn = this.restUpdateTableColumn.bind(this);
        this.restDeleteTableColumn = this.restDeleteTableColumn.bind(this);
        this.restAddTableIndex = this.restAddTableIndex.bind(this);
        this.restUpdateTableIndex = this.restUpdateTableIndex.bind(this);
        this.restDeleteTableIndex = this.restDeleteTableIndex.bind(this);
        this.restAddTableIndexColumn = this.restAddTableIndexColumn.bind(this);
        this.restUpdateTableIndexColumn = this.restUpdateTableIndexColumn.bind(this);
        this.restDeleteTableIndexColumn = this.restDeleteTableIndexColumn.bind(this);
        this.restGetTableEr = this.restGetTableEr.bind(this);
        this.restAddTableEr = this.restAddTableEr.bind(this);
        this.restUpdateTableEr = this.restUpdateTableEr.bind(this);
        this.restDeleteTableEr = this.restDeleteTableEr.bind(this);

        this.restGetTableErTrees = this.restGetTableErTrees.bind(this);
        this.restAddTableErTree = this.restAddTableErTree.bind(this);
        this.restUpdateTableErTree = this.restUpdateTableErTree.bind(this);
        this.restDeleteTableErTree = this.restDeleteTableErTree.bind(this);
        this.doAddTableErTree = this.doAddTableErTree.bind(this);
        this.doUpdateTableErTree = this.doUpdateTableErTree.bind(this);
        this.doDeleteTableErTree = this.doDeleteTableErTree.bind(this);

        this.restGetDbConnections = this.restGetDbConnections.bind(this);

        this.showTableDetail = this.showTableDetail.bind(this);

        this.x6Move = this.x6Move.bind(this);
        this.x6Update = this.x6Update.bind(this);
        this.x6AddEntityTable = this.x6AddEntityTable.bind(this);
        this.onButtonX6ToPng = this.onButtonX6ToPng.bind(this);
        this.onButtonX6Save = this.onButtonX6Save.bind(this);
        this.uiUpdateTableErTree = this.uiUpdateTableErTree.bind(this);
        this.getCommTreeNode = this.getCommTreeNode.bind(this);

        this.erTrees2antdTree = this.erTrees2antdTree.bind(this);

        this.restGetTableRecords = this.restGetTableRecords.bind(this);

        this.doAddTable = this.doAddTable.bind(this);
        this.doUpdateTable = this.doUpdateTable.bind(this);
        this.doDeleteTable = this.doDeleteTable.bind(this);
        this.doAddTableColumn = this.doAddTableColumn.bind(this);
        this.doUpdateTableColumn = this.doUpdateTableColumn.bind(this);
        this.doDeleteTableColumn = this.doDeleteTableColumn.bind(this);
        this.doAddTableIndex = this.doAddTableIndex.bind(this);
        this.doUpdateTableIndex = this.doUpdateTableIndex.bind(this);
        this.doDeleteTableIndex = this.doDeleteTableIndex.bind(this);
        this.doAddTableIndexColumn = this.doAddTableIndexColumn.bind(this);
        this.doUpdateTableIndexColumn = this.doUpdateTableIndexColumn.bind(this);
        this.doDeleteTableIndexColumn = this.doDeleteTableIndexColumn.bind(this);
        this.doGetTableEr = this.doGetTableEr.bind(this);
        this.doAddTableEr = this.doAddTableEr.bind(this);
        this.doUpdateTableEr = this.doUpdateTableEr.bind(this);
        this.doDeleteTableEr = this.doDeleteTableEr.bind(this);

        this.doNewGetAll = this.doNewGetAll.bind(this);
        this.doGetProductRelations = this.doGetProductRelations.bind(this);
        this.doNewGetProductLines = this.doNewGetProductLines.bind(this);
        this.doNewGetProductLineDbUsers = this.doNewGetProductLineDbUsers.bind(this);
        this.doNewGetProducts = this.doNewGetProducts.bind(this);
        this.doNewGetProductModules = this.doNewGetProductModules.bind(this);
        this.doNewGetProductVersions = this.doNewGetProductVersions.bind(this);
        this.doNewGetProductManagers = this.doNewGetProductManagers.bind(this);
        this.doNewGetTables = this.doNewGetTables.bind(this);
        this.doNewGetTableColumns = this.doNewGetTableColumns.bind(this);
        this.doNewGetTypes = this.doNewGetTypes.bind(this);
        this.doGetTablesByLetter = this.doGetTablesByLetter.bind(this);
        this.doGetTablePropertyIndexColumns = this.doGetTablePropertyIndexColumns.bind(this);

        this.uiUpdateTable = this.uiUpdateTable.bind(this);
        this.dsUpdateTable = this.dsUpdateTable.bind(this);
        this.uiUpdateTableColumn = this.uiUpdateTableColumn.bind(this);
        this.dsUpdateTableColumn = this.dsUpdateTableColumn.bind(this);
        this.uiUpdateTableIndex = this.uiUpdateTableIndex.bind(this);
        this.dsUpdateTableIndex = this.dsUpdateTableIndex.bind(this);
        this.uiUpdateTableIndexColumn = this.uiUpdateTableIndexColumn.bind(this);
        this.dsUpdateTableIndexColumn = this.dsUpdateTableIndexColumn.bind(this);

        this.uiGetTablesByLetter = this.uiGetTablesByLetter.bind(this);

        this.onSelectDbUsersChanged = this.onSelectDbUsersChanged.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onSelectConnectionsChanged = this.onSelectConnectionsChanged.bind(this);
        this.onSelectOnlineConnectionsChanged = this.onSelectOnlineConnectionsChanged.bind(this);
        this.onTableUnknownChecked = this.onTableUnknownChecked.bind(this);
        this.onTableKnownChecked = this.onTableKnownChecked.bind(this);

        this.onTreeProductsSelected = this.onTreeProductsSelected.bind(this);
        this.onTreeTablesKnownSelected = this.onTreeTablesKnownSelected.bind(this);
        this.onTreeTablesOnlineSelected = this.onTreeTablesOnlineSelected.bind(this);
        this.onTreeErDiagramSelected = this.onTreeErDiagramSelected.bind(this);
        this.onTreeProductsExpanded = this.onTreeProductsExpanded.bind(this);

        this.showProductDbUsers = this.showProductDbUsers.bind(this);
        this.showProductTables = this.showProductTables.bind(this);
        this.showModuleTables = this.showModuleTables.bind(this);
        this.onTreeLettersKnownSelected = this.onTreeLettersKnownSelected.bind(this);
        this.getTableId = this.getTableId.bind(this);

        this.onButtonAddTableClicked = this.onButtonAddTableClicked.bind(this);
        this.onButtonCloneTableClicked = this.onButtonCloneTableClicked.bind(this);
        this.onButtonRenameTableClicked = this.onButtonRenameTableClicked.bind(this);
        this.onButtonDeleteTableClicked = this.onButtonDeleteTableClicked.bind(this);
        this.onButtonAddColumnClicked = this.onButtonAddColumnClicked.bind(this);
        this.onButtonAlterColumnClicked = this.onButtonAlterColumnClicked.bind(this);
        this.onButtonDeleteColumnClicked = this.onButtonDeleteColumnClicked.bind(this);
        this.onButtonAlterColumnConfirmClicked = this.onButtonAlterColumnConfirmClicked.bind(this);
        this.onButtonAlterColumnCancelClicked = this.onButtonAlterColumnCancelClicked.bind(this);
        this.onButtonAddIndexClicked = this.onButtonAddIndexClicked.bind(this);
        this.onButtonAlterIndexClicked = this.onButtonAlterIndexClicked.bind(this);
        this.onButtonDeleteIndexClicked = this.onButtonDeleteIndexClicked.bind(this);
        this.onButtonAlterIndexConfirmClicked = this.onButtonAlterIndexConfirmClicked.bind(this);
        this.onButtonAlterIndexCancelClicked = this.onButtonAlterIndexCancelClicked.bind(this);
        this.onButtonAddPartitionClicked = this.onButtonAddPartitionClicked.bind(this);
        this.onButtonAlterPartitionClicked = this.onButtonAlterPartitionClicked.bind(this);
        this.onButtonDeletePartitionClicked = this.onButtonDeletePartitionClicked.bind(this);
        this.onButtonAlterPartitionConfirmClicked = this.onButtonAlterPartitionConfirmClicked.bind(this);
        this.onButtonAlterPartitionCancelClicked = this.onButtonAlterPartitionCancelClicked.bind(this);
        this.onButtonAddRelationClicked = this.onButtonAddRelationClicked.bind(this);
        this.onButtonAlterRelationClicked = this.onButtonAlterRelationClicked.bind(this);
        this.onButtonDeleteRelationClicked = this.onButtonDeleteRelationClicked.bind(this);
        this.onButtonAlterRelationConfirmClicked = this.onButtonAlterRelationConfirmClicked.bind(this);
        this.onButtonAlterRelationCancelClicked = this.onButtonAlterRelationCancelClicked.bind(this);
        this.onButtonAddRecordClicked = this.onButtonAddRecordClicked.bind(this);
        this.onButtonAlterRecordClicked = this.onButtonAlterRecordClicked.bind(this);
        this.onButtonDeleteRecordClicked = this.onButtonDeleteRecordClicked.bind(this);
        this.onButtonAlterRecordConfirmClicked = this.onButtonAlterRecordConfirmClicked.bind(this);
        this.onButtonAlterRecordCancelClicked = this.onButtonAlterRecordCancelClicked.bind(this);
        this.onButtonProductsChangeComponentSizeClicked = this.onButtonProductsChangeComponentSizeClicked.bind(this);
        this.onButtonTablesChangeComponentSizeClicked = this.onButtonTablesChangeComponentSizeClicked.bind(this);
        this.onButtonTableNameEditingConfirmClicked = this.onButtonTableNameEditingConfirmClicked.bind(this);
        this.onButtonTableNameEditingCancelClicked = this.onButtonTableNameEditingCancelClicked.bind(this);
        this.onButtonColumnEditingConfirmClicked = this.onButtonColumnEditingConfirmClicked.bind(this);
        this.onButtonColumnEditingCancelClicked = this.onButtonColumnEditingCancelClicked.bind(this);
        this.onButtonErDiagramClicked = this.onButtonErDiagramClicked.bind(this);
        this.onButtonX6FormConfirmClicked = this.onButtonX6FormConfirmClicked.bind(this);
        this.onButtonX6FormCancelClicked = this.onButtonX6FormCancelClicked.bind(this);
        this.onButtonAddTableErDirClicked = this.onButtonAddTableErDirClicked.bind(this);
        this.onButtonAddTableErClicked = this.onButtonAddTableErClicked.bind(this);
        this.onButtonAddTable2ErDiagramClicked = this.onButtonAddTable2ErDiagramClicked.bind(this);
        this.onButtonGetTableDataClicked = this.onButtonGetTableDataClicked.bind(this);

        this.onInputIndexNameChanged = this.onInputIndexNameChanged.bind(this);
        this.onInputPartitionNameChanged = this.onInputPartitionNameChanged.bind(this);
        this.onInputTableNameChanged = this.onInputTableNameChanged.bind(this);

        this.onInputColumnNameChanged = this.onInputColumnNameChanged.bind(this);
        this.onInputColumnDataLengthChanged = this.onInputColumnDataLengthChanged.bind(this);
        this.onInputColumnDataDefaultChanged = this.onInputColumnDataDefaultChanged.bind(this);
        this.onInputColumnSplitFlagChanged = this.onInputColumnSplitFlagChanged.bind(this);
        this.onInputColumnRepeatFlagChanged = this.onInputColumnRepeatFlagChanged.bind(this);
        this.onButtonListTreeClicked = this.onButtonListTreeClicked.bind(this);
        this.onInputColumnDescChanged = this.onInputColumnDescChanged.bind(this);


        this.onCheckboxColumnPrimaryFlagChanged = this.onCheckboxColumnPrimaryFlagChanged.bind(this);
        this.onCheckboxColumnNullableFlagChanged = this.onCheckboxColumnNullableFlagChanged.bind(this);

        this.onSelectColumnDataTypeChanged = this.onSelectColumnDataTypeChanged.bind(this);
        this.onSelectX6TableColumnDataTypeChanged = this.onSelectX6TableColumnDataTypeChanged.bind(this);

        this.onTabsTablePropertiesChanged = this.onTabsTablePropertiesChanged.bind(this);
        this.onDataSourceChanged = this.onDataSourceChanged.bind(this);
    }

    componentDidMount() {
        // this.doMock();
        this.doNewGetAll();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.state.isErDiagram) {
            if (nextState.styleLayout !== this.state.styleLayout) {
                this.x6Graph.resize(50, 50);
            }
        }

        return true
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.isErDiagram) {
            if (prevState.styleLayout !== this.state.styleLayout) {
                this.x6Graph.resize(this.gRef.x6GraphContainerBox.current.offsetWidth, this.gRef.x6GraphContainerBox.current.offsetHeight);
            }
        }
    }

    doInit() {
        this.gCurrent.productLineId = undefined;
        this.gCurrent.productId = undefined;
        this.gCurrent.moduleId = undefined;
        this.gCurrent.dbUserId = -1;

        if (this.state.isErDiagram) {
            this.x6Init();
        } else {
            this.setState({
                tablePropertiesScrollY: this.gRef.boxTableColumns.current.scrollHeight - 40,
            })
        }

        let dataTreeProducts = [];

        this.gMap.productLines.forEach((valuePl) => {
            let plId = valuePl.product_line_id;
            let nodeProductLine = {
                key: plId,
                title: valuePl.product_line_name,
                children: [],
                nodeType: "product_line"
            }
            dataTreeProducts.push(nodeProductLine);
            valuePl.products.forEach(item => {
                let pId = item;
                let nodeProduct = {
                    key: plId + "_" + pId,
                    title: this.gMap.products.get(pId).product_name,
                    children: [],
                    nodeType: "product"
                }
                nodeProductLine.children.push(nodeProduct);
                this.gMap.products.get(item).modules.forEach(item => {
                    let mId = item;
                    let nodeModule = {
                        key: plId + "_" + pId + "_" + mId,
                        title: this.gMap.modules.get(mId).module_name,
                        children: [],
                        nodeType: "module"
                    }
                    nodeProduct.children.push(nodeModule);
                })
            })
        });
        this.gUi.treeProductsData = dataTreeProducts;
        this.setState({
            treeDataProducts: this.gUi.treeProductsData,
        })

        this.gUi.treeProductsData = dataTreeProducts;

        let connectionsSelectOptions = [{value: -1, label: "请选择来源数据库"}];
        this.gData.connections.forEach((item) => {
            let option = {
                value: item.connection_id,
                label: item.connection_name
            }
            connectionsSelectOptions.push(option);
        })

        this.setState({
            connectionsSelectOptions: connectionsSelectOptions
        })
    }

    onButtonX6FormConfirmClicked() {

    }

    onButtonX6FormCancelClicked() {

    }

    x6ElementsStyleReset() {
        const nodes = this.x6Graph.getNodes();
        const edges = this.x6Graph.getEdges();

        nodes.forEach(node => {
            node.attr('body/stroke', '#000')
        })

        edges.forEach(edge => {
            edge.attr('line/stroke', 'black')
            edge.prop('labels/0', {
                attrs: {
                    body: {
                        stroke: 'black'
                    }
                }
            })
        })
    }

    // >>>> x6 init
    x6Init() {
        EditableCellTool.config({
            tagName: 'div',
            isSVGElement: false,
        });

        Graph.registerConnector('algo-edge',
            (source, target) => {
                const offset = 4
                const control = 80
                const v1 = {x: source.x, y: source.y + offset + control}
                const v2 = {x: target.x, y: target.y - offset - control}

                return `
                    M ${source.x} ${source.y}
                    L ${source.x} ${source.y + offset}
                    C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${target.x} ${target.y - offset}
                    L ${target.x} ${target.y}
                `;
            },
            true,
        );

        Graph.registerNodeTool('editableCell', EditableCellTool, true);

        this.x6Graph = new Graph({
            container: this.gRef.x6GraphContainer.current,
            grid: true,
            snapline: {
                enabled: true,
            },
            scroller: {
                enabled: true,
                pageVisible: false,
                pageBreak: false,
                pannable: true,
            },
            connecting: {
                snap: true,
                allowBlank: false,
                allowLoop: false,
                highlight: true,
                validateMagnet: ({cell, magnet}) => {
                    let count = 0;
                    let connectionCount = magnet.getAttribute("connection-count");
                    let max = connectionCount ? parseInt(connectionCount, 10) : Number.MAX_SAFE_INTEGER
                    const outgoingEdges = this.x6Graph.getOutgoingEdges(cell)
                    if (outgoingEdges) {
                        outgoingEdges.forEach((edge) => {
                            const edgeView = this.x6Graph.findViewByCell(edge);
                            if (edgeView.sourceMagnet === magnet) {
                                count += 1
                            }
                        })
                    }

                    return count < max
                },
                createEdge: (source, target) => {
                    let edge = this.x6Graph.createEdge({
                        source,
                        target,
                        router: {
                            name: 'manhattan',
                            args: {
                                startDirections: ['right'],
                                endDirections: ['left'],
                            },
                        },
                        attrs: {
                            line: {
                                stroke: '#722ed1',
                            },
                        },
                    });

                    this.gDynamic.edge = edge;

                    return edge;
                },

            },
            translating: {
                restrict: this.x6Move,
            },
        });

        this.x6Graph.on('blank:click', () => {
            this.setState({
                nodeType: "unknown"
            });

            // 恢复上一次选中 node 的样式
            if (this.gCurrent.node !== null && this.gCurrent.node !== undefined) {
                this.gCurrent.node.attr('body', {
                    stroke: this.gCurrent.nodeAttrs.rect.stroke,
                })
            }
            this.gCurrent.node = null;
        });

        // >>>>> x6Graph on node:click
        this.x6Graph.on('node:click', ({node}) => {
            let nodeData = node.getData();

            // 恢复上一次选中 node 的样式
            if (this.gCurrent.node !== null && this.gCurrent.node !== undefined) {
                this.gCurrent.node.attr('body', {
                    stroke: this.gCurrent.nodeAttrs.rect.stroke,
                })
            }
            this.gCurrent.node = node;
            this.gCurrent.nodeAttrs = node.getAttrs();

            // 设置选中 node 的样式
            node.attr('body', {
                stroke: '#ffa940',
            })

            if (nodeData.nodeType === "table") {
                node.toFront({deep: true});
                this.setState({
                    nodeType: "table"
                });
            } else if (nodeData.nodeType === "table_column") {
                this.setState({
                    nodeType: "table_column"
                });
            } else if (nodeData.nodeType === "table_button_add_column") {
                this.setState({
                    nodeType: "table_button_add_column"
                });

                let nodeTable = node.getParent();
                let cc = nodeTable.getChildren().length;
                let h = nodeTable.size().height;
                let hAdd = 30;

                if (cc === 1) hAdd = 40;

                nodeTable.resize(160, h + hAdd);

                let newColumnName = "new_table_column";
                let myNodeColumn = this.x6Graph.createNode({
                    width: 140,
                    height: 30,
                    shape: 'rect',
                    attrs: {
                        body: {
                            fill: 'rgba(95,159,255,.2)',
                            stroke: 'gray',
                            strokeWidth: 1,
                        },
                        label: {
                            fill: 'rgba(95,159,255,1)',
                            fontSize: 14,
                            fontWeight: "bold",
                            text: newColumnName,
                        },
                    },
                    ports: {
                        groups: {
                            groupLeft: {
                                position: {
                                    name: "left",
                                }
                            },
                            groupRight: {
                                position: {
                                    name: "right",
                                }
                            }
                        },
                    },
                });

                myNodeColumn.setData({
                    x: 0,
                    y: 0,
                    nodeType: "table_column",
                    columnName: newColumnName,
                });

                myNodeColumn.position(nodeTable.position().x + 10, nodeTable.position().y + h + hAdd - 40 - hAdd);

                nodeTable.addChild(myNodeColumn);

                node.position(nodeTable.position().x + 10, nodeTable.position().y + h + hAdd - 40);
            }
        });

        this.x6Graph.on('node:mouseenter', ({node}) => {
            let nodeData = node.getData();

            this.gDynamic.node = node;

            if (nodeData.nodeType === "table") {
                node.addTools([
                    {
                        name: 'button-remove',
                        args: {x: "100%", y: 0, offset: {x: -10, y: 10}},
                    },
                ]);
                // node.toFront({deep: true});
            } else if (nodeData.nodeType === "table_column") {
                node.addTools([
                    {
                        name: 'button-remove',
                        args: {x: "100%", y: "50%", offset: {x: -20, y: 0}},
                    },
                ]);
            }

        });

        this.x6Graph.on('node:mouseleave', ({cell}) => {
            cell.removeTools()
        })

        this.x6Graph.on('edge:click', ({edge}) => {

        });

        this.x6Graph.on('edge:mouseenter', ({cell}) => {
            cell.addTools([
                {
                    name: 'button-remove',
                    args: {distance: -40},
                },
                {
                    name: 'source-arrowhead',
                },
                {
                    name: 'target-arrowhead',
                    args: {
                        attrs: {
                            fill: 'red',
                        },
                    },
                },
            ])

            cell.attr('line/strokeWidth', '3');

            cell.toFront({deep: true});

        });

        this.x6Graph.on('edge:mouseleave', ({cell}) => {
            cell.removeTools()
            cell.attr('line/strokeWidth', '1');
        })

        // >>>>> x6 on node:dblclick
        this.x6Graph.on("node:dblclick", ({cell, e}) => {
            let nodeData = cell.getData();
            let tableId = nodeData.nodeId;
            let myTable = this.gMap.tables.get(tableId);
            let myDbUser = this.gMap.dbUsers.get(myTable.db_user_id);
            let myModule = this.gMap.modules.get(myTable.module_id);
            let myProduct = this.gMap.products.get(myModule.product_id);
            let myProductLine = this.gMap.productLines.get(myDbUser.product_line_id);
            let tableFirstLetter = myTable.table_name[0].toUpperCase();

            this.gCurrent.productLineId = myProductLine.product_line_id;
            this.gCurrent.productId = myProduct.product_id;
            this.gCurrent.moduleId = myModule.module_id;
            this.gCurrent.dbUserId = myDbUser.user_id;
            this.gCurrent.productsNodeSelectedType = "module";
            this.gCurrent.letterSelected = tableFirstLetter;
            this.gCurrent.tableId = myTable.table_id;

            let keys = [
                myProductLine.product_line_id,
                myProductLine.product_line_id + "_" + myProduct.product_id,
                myProductLine.product_line_id + "_" + myProduct.product_id + "_" + myModule.module_id,
            ];

            this.showProductDbUsers();
            this.showModuleTables();
            this.showTableDetail();

            let tablesTreeData = this.doGetTablesByLetter("known", tableFirstLetter);

            this.setState({
                treeSelectedKeysProducts: [keys[2]],
                treeExpandedKeysProducts: keys,
                isErDiagram: false,
                tabNavSelected: "tabNavOne",
                treeDataTablesKnown: tablesTreeData,
                treeSelectedKeysTableFirstLetters: tableFirstLetter,
                treeSelectedKeysTables: [myTable.table_id],
                productLineDbUserId: myDbUser.user_id
            })
        });

        this.x6Graph.on('edge:dblclick', ({edge}) => {
            alert(
                `边ID:${edge.id}, 起始节点: ${edge.source.cell},目标节点: ${edge.target.cell}`
            )
        });

        // >>>>> x6 on edge:connected
        this.x6Graph.on('edge:connected', ({isNew, edge, currentCell}) => {
            console.log("x6 on edge:connected");
            if (isNew) {
                console.log(edge);
                const nodeSource = edge.getSourceCell();
                // const nodeCurrent = edge.getCurrentCell();
                console.log(nodeSource.getData(), currentCell.getData());
                let sNodeData = nodeSource.getData();
                let aNodeData = currentCell.getData();
                let sTableId = this.gMap.columns.get(sNodeData.nodeId).table_id;
                let aTableId = this.gMap.columns.get(aNodeData.nodeId).table_id;
                let tableRelation = new TadTableRelation();
                tableRelation.s_table_id = sTableId;
                tableRelation.s_column_id = sNodeData.nodeId;
                tableRelation.a_table_id = aTableId;
                tableRelation.a_column_id = aNodeData.nodeId;
                tableRelation.relation_type = "1-1";
                this.doAddTableRelation(tableRelation);
            }
        })

        // >>>>> on change 节点位置
        this.x6Graph.on("node:change:position", (args) => {
            let nodeData = args.cell.getData();

            if (nodeData.nodeType.toUpperCase() === "TABLE") {
                let erTables = this.gMap.erTablesByDiagram.get(this.gCurrent.erDiagramId);
                let attrs = erTables.attrs.get(nodeData.nodeId);
                attrs.position_x = args.current.x;
                attrs.position_y = args.current.y;
            }

            // for(let i = 0; i < this.x6Data.tables.length; i++) {
            //     if (this.x6Data.tables[i].id === nodeData.nodeId) {
            //         this.x6Data.tables[i].x = args.current.x;
            //         this.x6Data.tables[i].y = args.current.y;
            //         break
            //     }
            // }
        });


        this.x6Graph.centerContent();

        this.x6Stencil = new Stencil({
            // title: '组件库',
            target: this.x6Graph,
            // collapsable: true,
            stencilGraphWidth: 100,
            stencilGraphHeight: 120,
            layoutOptions: {
                columns: 1,
                columnWidth: 100,
                rowHeight: 50,
                center: true,
                dx: 0,
                dy: 10,
            },
            groups: [
                {
                    name: 'group1',
                    title: '库表对象',
                },
            ],
            getDragNode: (node) => {
                let myNode = this.x6Graph.createNode({
                    width: 160,
                    height: 40,
                    shape: 'rect',
                    attrs: {
                        body: {
                            fill: 'transparent',
                            stroke: 'transparent',
                            strokeWidth: 1,
                        }
                    },
                });

                myNode.setData({
                    x: 0,
                    y: 0,
                    nodeType: "shadow_table",
                });

                this.x6Graph.addNode(myNode);

                myNode.on('change:position', this.x6Update);

                let nodeClone = node.clone();
                this.gDynamic.nodeShadow = myNode;
                nodeClone.on("change:position", (args) => {
                    this.gDynamic.x = args.current.x;
                    this.gDynamic.y = args.current.y;
                });

                this.gDynamic.timerMove = setInterval(() => {
                    this.gDynamic.nodeShadow.position(this.gDynamic.x, this.gDynamic.y)
                }, 10);

                return nodeClone
            },
            getDropNode: (node) => {
                clearInterval(this.gDynamic.timerMove);

                this.gDynamic.nodeShadow.size(160, 70);
                this.gDynamic.nodeShadow.attr('body/stroke', '#5F9FFF');
                this.gDynamic.nodeShadow.attr('body/fill', '#2F2F2F');
                this.gDynamic.nodeShadow.attr('label/fill', '#EFEFEF');
                this.gDynamic.nodeShadow.attr('label/fontSize', '14')
                this.gDynamic.nodeShadow.attr('label/fontWeight', 'bold')
                this.gDynamic.nodeShadow.attr('label/refX', '0.5')
                this.gDynamic.nodeShadow.attr('label/refY', '5')
                this.gDynamic.nodeShadow.attr('label/textAnchor', 'middle')
                this.gDynamic.nodeShadow.attr('label/textVerticalAnchor', 'top')
                this.gDynamic.nodeShadow.attr('label/text', 'new_table');
                this.gDynamic.nodeShadow.setData({tableName: "new_table"});

                let myNodeButtonAdd = this.x6Graph.createNode({
                    width: 140,
                    height: 30,
                    shape: 'rect',
                    attrs: {
                        body: {
                            fill: 'rgba(95,159,255,.2)',
                            stroke: 'gray',
                            strokeWidth: 1,
                        },
                        label: {
                            fill: 'rgba(95,159,255,1)',
                            fontSize: 14,
                            fontWeight: "bold",
                            text: "+",
                            // refX: 0.5,
                            // refY: 5,
                            // textAnchor: 'middle',
                            // textVerticalAnchor: 'top',
                        },
                    },
                });

                myNodeButtonAdd.setData({
                    x: 0,
                    y: 0,
                    nodeType: "table_button_add_column",
                });

                myNodeButtonAdd.position(this.gDynamic.x + 10, this.gDynamic.y + 30);

                this.gDynamic.nodeShadow.addChild(myNodeButtonAdd);
                this.gDynamic.nodeShadow.setData({
                    nodeType: "table"
                })

                this.setState({
                    nodeType: "table"
                });

                this.gCurrent.node = this.gDynamic.nodeShadow;
                this.gCurrent.nodeAttrs = this.gDynamic.nodeShadow.getAttrs();

                return node.clone();
            },
            validateNode: (node, options) => {
                let pos = node.position();

                node.setData({
                    x: pos.x,
                    y: pos.y,
                });

                return false
            }
        })

        this.gRef.x6StencilContainerBox.current.appendChild(this.x6Stencil.container);

        const rTable = new Rect({
            width: 60,
            height: 40,
            attrs: {
                body: {
                    fill: '#AFAFAF',
                    stroke: '#4B4A67',
                    strokeWidth: 1,
                },
                text: {
                    text: '表',
                    fill: 'black',
                    fontWeight: "bold",
                },
            },
        })
        rTable.setData({nodeType: "table"});

        this.x6Stencil.load([rTable], 'group1')
    }

    x6Move() {
        let view = this.x6Graph.findViewByCell(this.gDynamic.node);

        if ((view !== null) && (view !== undefined)) {
            if ((this.gDynamic.node.data.nodeType === "table_column") || (this.gDynamic.node.data.nodeType === "table_button_add_column")) {
                return view.cell.getBBox();
            }

            return null
        }
    }

    x6Update() {
        let edgeView = this.x6Graph.findViewByCell(this.gDynamic.edge);

        if ((edgeView !== null) && (edgeView !== undefined)) {
            edgeView.update()
        }
    }

    // >>>>> x6 add Entity Table
    x6AddEntityTable(table, id) {
        let x = table.positionX === undefined ? 50 : table.positionX;
        let y = table.positionY === undefined ? 50 : table.positionY;
        let hTitle = 30;
        let wc = 120;
        let hc = 30;
        let wt = wc + 20;
        let ht = hc + 20;

        let node = {
            x: x,
            y: y,
            width: wt,
            height: ht,
            label: table.table_name,
            attrs: {
                body: {
                    connectionCount: 0,
                    stroke: "#0F0F0F",
                    strokeWidth: 1,
                    fill: '#AFAFAF',
                    magnet: true,
                },
                label: {
                    fill: '#000000',
                    fontSize: 14,
                    fontWeight: "bold",
                    refX: 0.5,
                    refY: 5,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'top',
                },
            },
        }
        if (id !== undefined) {
            node.id = id;
        }
        let enTable = this.x6Graph.addNode(node);
        enTable.on('change:position', this.x6Update);

        let n = 0;
        table.columns.forEach((item) => {
            let myColumn = this.gMap.columns.get(item);
            if ((myColumn.data_type === "int") || (myColumn.data_type === "number")) {
                let enColumn = this.x6Graph.addNode({
                    x: x,
                    y: y + n * (hc + 2),
                    width: wc,
                    height: hc,
                    label: myColumn.column_name,
                    attrs: {
                        body: {
                            connectionCount: 0,
                            stroke: "#2F2F2F",
                            strokeWidth: 1,
                            fill: '#8F8F8F',
                            magnet: true,
                        },
                        label: {
                            fill: '#fff',
                            fontSize: 12,
                        },
                    },
                    ports: {
                        groups: {
                            groupLeft: {
                                position: {
                                    name: "left",
                                }
                            },
                            groupRight: {
                                position: {
                                    name: "right",
                                }
                            }
                        },
                    },
                });

                if ((myColumn.data_type === "int") || (myColumn.data_type === "number")) {
                    enColumn.addPort({
                        id: 'portLeft',
                        group: "groupLeft",
                        attrs: {
                            circle: {
                                connectionCount: 1,
                                r: 5,
                                magnet: true,
                                stroke: '#AFDEFF',
                                fill: '#FFF',
                                strokeWidth: 1,
                            },
                        },
                    });

                    enColumn.addPort({
                        id: 'portRight',
                        group: "groupRight",
                        attrs: {
                            circle: {
                                connectionCount: 2,
                                r: 5,
                                magnet: true,
                                stroke: '#AFDEFF',
                                fill: '#FFF',
                                strokeWidth: 1,
                            },
                        },
                    });
                }

                enColumn.setData({
                    nodeType: "table_column",
                    nodeId: item,
                });

                enTable.addChild(enColumn);

                // let view = this.x6Graph.findViewByCell(enColumn);
                // view.can("nodeMovable", false);

                n++;
            }
        });

        enTable.setData({
            nodeType: "table",
            nodeId: table.table_id
        });

        enTable.fit({padding: {top: hTitle + 10, bottom: 10, left: 10, right: 10}});

        return enTable;
    }

    onButtonX6ToPng(e) {
        this.x6Graph.toPNG((dataUri) => {
            DataUri.downloadDataUri(dataUri, "x6ErInstance.png");
        }, {
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            }
        })
    }

    // >>>>> on button 保存ER图 clicked

    x6DrawRelation(relation) {
        let nodeSource = this.x6Graph.getCellById(relation.nodeSource)
        let nodeDataSource = nodeSource.getData();
        let nodeTarget = this.x6Graph.getCellById(relation.nodeTarget)
        let nodeDataTarget = nodeTarget.getData();
        this.x6Graph.addEdge({
            source: {
                cell: nodeSource,
                port: nodeDataSource.portId
            },
            target: {
                cell: nodeTarget,
                port: nodeDataTarget.portId
            },
            router: {
                name: 'er',
            }
        });
    }

    onButtonX6Save(e) {
        const nodes = this.x6Graph.getNodes();
        console.log(this.gCurrent);
        const erTables = this.gMap.erTablesByDiagram.get(this.gCurrent.erTreeNode.id);

        console.log(erTables);
        nodes.forEach((itemNode) => {
            let nodeData = itemNode.getData();
            if (nodeData.nodeType.toUpperCase() === "TABLE") {
                let erTable = new TadTableErTable();
                let attrs = erTables.attrs.get(nodeData.nodeId);
                erTable.uuid = attrs.uuid;
                erTable.position_x = Math.floor(attrs.position_x);
                erTable.position_y = Math.floor(attrs.position_y);
                this.doUpdateTableErTable(erTable);
            }
        })
    }

    // >>>>> on button Add Table Er Dir clicked
    onButtonAddTableErDirClicked(e) {
        let erTree = new TadTableErTree();

        if ((this.gCurrent.erTreeNode !== null) && (this.gCurrent.erTreeNode !== undefined)) {
            if (this.gCurrent.erTreeNode.nodeType !== "NODE_DIR") return
            erTree.node_parent_id = this.gCurrent.erTreeNode.id;
        } else {
            erTree.node_parent_id = -1;
        }

        erTree.node_zhname = "新增目录";
        erTree.node_enname = "newErDir";
        erTree.node_type = "NODE_DIR";

        this.doAddTableErTree(erTree);
    }

    // >>>>> on button 将表加入ER图 clicked
    onButtonAddTable2ErDiagramClicked(e) {
        let erTable = new TadTableErTable();

        if ((this.gCurrent.erTreeNode !== null) && (this.gCurrent.erTreeNode !== undefined)) {
            if (this.gCurrent.erTreeNode.nodeType === "NODE_ER_DIAGRAM") {

                if (this.gMap.erTablesByDiagram.has(this.gCurrent.erTreeNode.id)) {
                    if (this.gMap.erTablesByDiagram.get(this.gCurrent.erTreeNode.id).tables.includes(this.gCurrent.tableId)) {
                        console.log("引用过，且被当前ER图引用");
                        return
                    }
                }

                if (!this.gMap.erTablesByDiagram.has(this.gCurrent.erTreeNode.id)) {
                    // 如果表从未被引用
                    console.log("表从未被引用");
                    this.gMap.erTablesByDiagram.set(this.gCurrent.erTreeNode.id, {
                        isLoaded: true,
                        tables: [erTable.table_id]
                    });

                    // erTable.er_id = this.gCurrent.erTreeNode.id;
                    // erTable.table_id = this.gCurrent.tableId;
                    // this.doAddTableErTable(erTable);
                    // let myTable = lodash.cloneDeep(this.gMap.tables.get(erTable.table_id));
                    // this.x6AddEntityTable(myTable);
                    // this.myJson = this.x6Graph.toJSON();
                    // let strJson = JSON.stringify(this.myJson);
                    // let myTableEr = new TadTableEr();
                    // myTableEr.er_id = this.gCurrent.erTreeNode.id;
                    // myTableEr.er_content = strJson;
                    // this.doUpdateTableEr(myTableEr);
                    // let tableRelation = new TadTableRelation();
                    // tableRelation.s_table_id = this.gCurrent.tableId;
                    // tableRelation.relation_type = "TEST";
                    // this.doGetTableRelation(tableRelation);
                } else {
                    // 该表被引用过，现在确认当前ER图是否引用
                    this.gMap.erTablesByDiagram.get(this.gCurrent.erTreeNode.id).tables.push(erTable.table_id);
                    console.log("该表被引用过，但当前ER图没有引用");
                }

                this.x6Data.tables.push({
                    id: "",
                    tableId: this.gCurrent.tableId,
                    x: 50,
                    y: 50
                });

                erTable.er_id = this.gCurrent.erTreeNode.id;
                erTable.table_id = this.gCurrent.tableId;
                this.doAddTableErTable(erTable);
                let myTable = lodash.cloneDeep(this.gMap.tables.get(erTable.table_id));
                this.x6AddEntityTable(myTable);
                // this.myJson = this.x6Graph.toJSON();
                // let strJson = JSON.stringify(this.myJson);
                // let myTableEr = new TadTableEr();
                // myTableEr.er_id = this.gCurrent.erTreeNode.id;
                // myTableEr.er_content = strJson;
                // this.doUpdateTableEr(myTableEr);
                let tableRelation = new TadTableRelation();
                tableRelation.s_table_id = this.gCurrent.tableId;
                tableRelation.relation_type = "TEST";
                this.doGetTableRelation(tableRelation);
            }
        }
    }

    onButtonAddTableErClicked(e) {
        let erTree = new TadTableErTree();

        if ((this.gCurrent.erTreeNode !== null) && (this.gCurrent.erTreeNode !== undefined)) {
            if (this.gCurrent.erTreeNode.nodeType !== "NODE_DIR") return

            erTree.node_parent_id = this.gCurrent.erTreeNode.id;
        } else {
            erTree.node_parent_id = -1;
        }

        erTree.node_zhname = "新增ER图";
        erTree.node_enname = "newErDiagram";
        erTree.node_type = "NODE_ER_DIAGRAM";

        this.doAddTableErTree(erTree);
    }

    restGetTableRecords(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_records",
            params,
            {headers: {'Content-Type': 'application/json'}}
        );
    }

    restGetTableRelations() {
        let params = {};

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_relations",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restGetTableRelation(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_relation",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableRelation(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_relation",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableRelation(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_relation",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableRelation(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_relation",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restTestTableRelation(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/test_table_relation",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTableRelations() {
        this.restGetTableRelations().then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    // >>>>> get 表关系
    doGetTableRelation(params) {
        this.restGetTableRelation(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    console.log(result.data.data);
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    // >>>>> do 添加表关系
    doAddTableRelation(params) {
        this.restAddTableRelation(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // result.data.data.uuid = result.data.data.table_id;
                    // result.data.data.node_zhname = this.gMap.tables.get(result.data.data.table_id).table_name;
                    // result.data.data.node_type = "NODE_ER_TABLE";
                    // this.uiUpdateTableErTree(result.data.data, "add");
                    this.onButtonX6Save();
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableRelation(params) {
        this.restUpdateTableRelation(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableRelation(params) {
        this.restDeleteTableRelation(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    // >>>>> do 检测表关系是否存在
    doTestTableRelation(params) {
        this.restTestTableRelation(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    console.log(result.data.data);
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    restGetTableErTables() {
        let params = {};

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_er_tables",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableErTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_er_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableErTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_er_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableErTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_er_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    async doGetTableErTables(params) {
        return await this.restGetTableErTables(params);
    }

    doAddTableErTable(params) {
        this.restAddTableErTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    result.data.data.uuid = result.data.data.table_id;
                    result.data.data.node_zhname = this.gMap.tables.get(result.data.data.table_id).table_name;
                    result.data.data.node_type = "NODE_ER_TABLE";
                    this.uiUpdateTableErTree(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableErTable(params) {
        this.restUpdateTableErTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableErTable(params) {
        this.restDeleteTableErTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    restGetTableErTrees() {
        let params = {};

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_er_trees",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableErTree(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_er_tree",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableErTree(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_er_tree",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableErTree(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_er_tree",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doAddTableErTree(params) {
        this.restAddTableErTree(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTableErTree(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableErTree(params) {
        this.restUpdateTableErTree(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableErTree(params) {
        this.restDeleteTableErTree(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }


    restAddTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTable(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restGetTableEr(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_er",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableEr(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_er",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableEr(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_er",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableEr(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_er",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableIndex(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_index",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableIndex(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableIndex(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_index",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restAddTableIndexColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_index_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restUpdateTableIndexColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    restDeleteTableIndexColumn(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/delete_table_index_column",
            params,
            {headers: {'Content-Type': 'application/json'}})
    }

    erTrees2antdTree(treeNodes, pId, uiTrees) {
        for (let i = 0; i < treeNodes.length; i++) {
            if (treeNodes[i].node_parent_id === pId) {
                let uiTree = {
                    key: treeNodes[i].uuid,
                    title: treeNodes[i].node_zhname,
                    children: [],
                    tag: {
                        nodeType: treeNodes[i].node_type
                    }
                }
                uiTrees.children.push(uiTree);
                this.erTrees2antdTree(treeNodes, treeNodes[i].uuid, uiTree);
            }
        }

        return uiTrees;
    }

    restGetDbConnections() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_db_connections", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetAll() {
        axios.all([
            this.doGetProductRelations(),
            this.doNewGetProductLines(),
            this.doNewGetProductLineDbUsers(),
            this.doNewGetProducts(),
            this.doNewGetProductModules(),
            this.doNewGetProductVersions(),
            this.doNewGetProductManagers(),
            this.doNewGetTables(),
            this.doNewGetTableColumns(),
            this.doNewGetTypes(),
            this.restGetTableErTrees(),
            this.restGetTableErTables(),
            this.restGetDbConnections(),
        ]).then(axios.spread((
            productRelations,
            productLines,
            dbUsers,
            products,
            modules,
            versions,
            managers,
            tables,
            columns,
            types,
            erTrees,
            erTables,
            connections) => {
            let mapProductRelations = new Map();
            let mapProductLines = new Map();
            let mapDbUsers = new Map();
            let mapProducts = new Map();
            let mapModules = new Map();
            let mapVersions = new Map();
            let mapManagers = new Map();
            let mapTables = new Map();
            let mapColumns = new Map();
            let mapTypes = new Map();
            let mapErTables = new Map();
            let mapErTablesByDiagram = new Map();
            let mapConnections = new Map();

            this.gData.productRelations = productRelations.data.data;
            this.gData.productLines = productLines.data.data;
            this.gData.dbUsers = dbUsers.data.data;
            this.gData.products = products.data.data;
            this.gData.modules = modules.data.data;
            this.gData.versions = versions.data.data;
            this.gData.managers = managers.data.data;
            this.gData.tables = tables.data.data;
            this.gData.columns = columns.data.data;
            this.gData.types = types.data.data;
            let dsErTrees = erTrees.data.data;
            let treeDataTableErs = [];
            this.gData.connections = connections.data.data;

            for (let i = 0; i < dsErTrees.length; i++) {
                if (dsErTrees[i].node_parent_id === -1) {
                    let nodeRoot = {
                        key: dsErTrees[i].uuid,
                        title: dsErTrees[i].node_zhname,
                        children: [],
                        tag: {
                            nodeType: "NODE_DIR"
                        }
                    }
                    let nodeTrees = this.erTrees2antdTree(dsErTrees, dsErTrees[i].uuid, nodeRoot);
                    treeDataTableErs.push(nodeTrees);
                }
            }
            this.setState({
                treeDataTableErs: treeDataTableErs
            })

            erTables.data.data.forEach(function (itemErTable) {
                let myKey = itemErTable.er_id;
                if (!mapErTablesByDiagram.has(myKey)) {
                    let attrs = new Map();
                    attrs.set(itemErTable.table_id, itemErTable);
                    mapErTablesByDiagram.set(myKey, {
                        isLoaded: false,
                        tables: [itemErTable.table_id],
                        attrs: attrs
                    });
                } else {
                    mapErTablesByDiagram.get(myKey).tables.push(itemErTable.table_id);
                    mapErTablesByDiagram.get(myKey).attrs.set(itemErTable.table_id, itemErTable);
                }

                if (!mapErTables.has(itemErTable.uuid)) {
                    mapErTables.set(itemErTable.uuid, itemErTable);
                }
            });

            productLines.data.data.forEach(function (item) {
                let myKey = item.product_line_id;
                if (!mapProductLines.has(myKey)) {
                    mapProductLines.set(myKey, {
                        product_line_id: myKey,
                        product_line_name: item.product_line_name,
                        product_line_desc: item.product_line_desc,
                        products: [],
                        dbUsers: []
                    });
                }
            });

            dbUsers.data.data.forEach(function (item) {
                let myKey = item.user_id;
                if (!mapDbUsers.has(myKey)) {
                    mapDbUsers.set(myKey, {
                        user_id: myKey,
                        product_line_id: item.product_line_id,
                        user_name: item.user_name,
                        user_desc: item.user_desc
                    });
                }
                mapProductLines.get(item.product_line_id).dbUsers.push(myKey);
            });

            products.data.data.forEach(function (item) {
                let myKey = item.product_id;
                if (!mapProducts.has(myKey)) {
                    mapProducts.set(myKey, {
                        product_id: myKey,
                        product_name: item.product_name,
                        product_desc: item.product_desc,
                        modules: [],
                        versions: [],
                        managers: []
                    });
                }
            });

            modules.data.data.forEach(function (item) {
                let myKey = item.module_id;
                if (!mapModules.has(myKey)) {
                    mapModules.set(myKey, {
                        module_id: myKey,
                        product_id: item.product_id,
                        module_name: item.module_name,
                        module_desc: item.module_desc,
                        module_leader: item.module_leader
                    });
                }
                if (mapProducts.has(item.product_id)) {
                    mapProducts.get(item.product_id).modules.push(myKey);
                }
            });

            versions.data.data.forEach(function (item) {
                let myKey = item.version_id;
                if (!mapVersions.has(myKey)) {
                    mapVersions.set(myKey, {
                        version_id: myKey,
                        product_id: item.product_id,
                        version_name: item.user_name,
                        version_desc: item.user_desc
                    });
                }
                if (mapProducts.has(item.product_id)) {
                    mapProducts.get(item.product_id).versions.push(myKey);
                }
            });

            managers.data.data.forEach(function (item) {
                let myKey = item.product_manager_id;
                if (!mapManagers.has(myKey)) {
                    mapManagers.set(myKey, {
                        product_manager_id: myKey,
                        product_manager_name: item.product_manager_name,
                        tel_no: item.tel_no,
                        email_addr: item.email_addr,
                        work_addr: item.work_addr
                    });
                }
            });

            tables.data.data.forEach(function (item) {
                let myKey = item.table_id;
                if (!mapTables.has(myKey)) {
                    mapTables.set(myKey, {
                        table_id: myKey,
                        table_name: item.table_name,
                        table_desc: item.table_desc,
                        table_type_id: item.table_type_id,
                        table_label_id: item.table_label_id,
                        db_user_id: item.db_user_id,
                        module_id: item.module_id,
                        partition_column: item.partition_column,
                        partition_type: item.partition_type,
                        columns: []
                    });
                    // mapTablesByName.set(item.table_name, {
                    //     table_id: myKey
                    // })
                }
            });

            columns.data.data.forEach(function (item) {
                let myKey = item.column_id;
                if (!mapColumns.has(myKey)) {
                    mapColumns.set(myKey, {
                        column_id: myKey,
                        table_id: item.table_id,
                        column_name: item.column_name,
                        column_desc: item.column_desc,
                        column_type_id: item.column_type_id,
                        data_type: item.data_type,
                        data_length: item.data_length,
                        data_default: item.data_default,
                        nullable_flag: item.nullable_flag,
                        primary_flag: item.primary_flag,
                        split_flag: item.split_flag,
                        repeat_flag: item.repeat_flag
                    });
                }
                if (mapTables.has(item.table_id)) {
                    mapTables.get(item.table_id).columns.push(myKey);
                }
            });

            types.data.data.forEach(function (item) {
                let myKey = item.id;
                if (!mapTypes.has(myKey)) {
                    mapTypes.set(myKey, {
                        id: myKey,
                        type: item.type,
                        name: item.name,
                        desc: item.desc
                    });
                }
            });

            productRelations.data.data.forEach(function (item) {
                let myKey = item.product_rel_id;
                if (!mapProductRelations.has(myKey)) {
                    mapProductRelations.set(myKey, {
                        product_rel_id: myKey,
                        product_line_id: item.product_line_id,
                        product_id: item.product_id,
                        product_manager_id: item.product_manager_id
                    });

                    mapProductLines.get(item.product_line_id).products.push(item.product_id);
                    mapProducts.get(item.product_id).managers.push(item.product_manager_id)
                } else {
                    if (!mapProductLines.get(item.product_line_id).products.find(element => element === item.product_id)) {
                        mapProductLines.get(item.product_line_id).products.push(item.product_id);
                    }
                    if (!mapProducts.get(item.product_id).managers.find(element => element === item.product_manager_id)) {
                        mapProducts.get(item.product_id).managers.push(item.product_manager_id);
                    }
                }
            });

            connections.data.data.forEach(function (item) {
                let myKey = item.connection_id;
                if (!mapConnections.has(myKey)) {
                    mapConnections.set(myKey, {
                        connection_id: myKey,
                        connection_name: item.connection_name,
                        db_host: item.db_host,
                        db_port: item.db_port,
                        db_sid: item.db_sid,
                        db_username: item.db_username,
                        db_password: item.db_password,
                        db_type: item.db_type
                    });
                }
            });


            this.gMap.productRelations = mapProductRelations;
            this.gMap.productLines = mapProductLines;
            this.gMap.dbUsers = mapDbUsers;
            this.gMap.products = mapProducts;
            this.gMap.modules = mapModules;
            this.gMap.versions = mapVersions;
            this.gMap.managers = mapManagers;
            this.gMap.tables = mapTables;
            this.gMap.columns = mapColumns;
            this.gMap.types = mapTypes;
            this.gMap.erTables = mapErTables;
            this.gMap.erTablesByDiagram = mapErTablesByDiagram;
            this.gMap.connections = mapConnections;

        })).then(() => {
            this.doInit();
        });
    }

    doGetProductRelations() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_product_relations", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProductLines() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_product_lines", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProductLineDbUsers() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_db_users", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProducts() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_products", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProductModules() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_modules", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProductVersions() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_product_versions", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetProductManagers() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_product_managers", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetTables() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_tables", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetTableColumns() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_columns", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doNewGetTypes() {
        let params = {};
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_types", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyColumns(params) {

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_column", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyIndexes(params) {

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_index", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyIndexColumns(params) {

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_index_column", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyPartitions(params) {

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_partition", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyRelations(params) {
        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_relation", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    doGetTablePropertyRecords(params) {

        return axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_table_records", params,
            {headers: {'Content-Type': 'application/json'}})
    }

    // >>>>> 获取某字母开头的表
    doGetTablesByLetter(source, letter) {
        let myResult = [];

        if (letter === undefined) return myResult

        if (!this.gMap.tablesByLetter.has(letter)) return myResult;

        this.gMap.tablesByLetter.get(letter).tables.forEach((item) => {
            let table = this.gMap.tables.get(item);
            let nodeTable = {
                key: table.table_id,
                title: table.table_name,
                children: [],
                tag: {
                    nodeType: "table",
                },
            }

            myResult.push(nodeTable);
        });

        return myResult;
    }

    doAddTable(params) {
        this.restAddTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTable(result.data.data, "add");
                    this.dsUpdateTable(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTable(params) {
        this.restUpdateTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTable(result.data.data, "update");
                    this.dsUpdateTable(result.data.data, "update");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTable(params) {
        this.restDeleteTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doGetTableEr(params) {
        this.restGetTableEr(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doAddTableEr(params) {
        this.restAddTableEr(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableEr(params) {
        this.restUpdateTableEr(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableEr(params) {
        this.restDeleteTableEr(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    getCommTreeNode(treeNodes, id, uiTree) {
        for (let i = 0; i < treeNodes.length; i++) {
            if (treeNodes[i].key === id) {
                treeNodes[i].children.push(uiTree);
                return
            } else {
                this.getCommTreeNode(treeNodes[i].children, id, uiTree);
            }
        }
    }

    uiUpdateTableErTree(erTree, what) {
        let treeDataTableErs;

        switch (what) {
            case "add":
                treeDataTableErs = lodash.cloneDeep(this.state.treeDataTableErs);

                let uiTree = {
                    key: erTree.uuid,
                    title: erTree.node_zhname,
                    children: [],
                    tag: {
                        nodeType: erTree.node_type
                    }
                }

                if (erTree.node_parent_id === -1) {
                    treeDataTableErs.push(uiTree);
                } else {
                    this.getCommTreeNode(treeDataTableErs, this.gCurrent.erTreeNode.id, uiTree);
                }

                this.setState({
                    treeDataTableErs: treeDataTableErs
                })
                break
            case "adds":
                treeDataTableErs = lodash.cloneDeep(this.state.treeDataTableErs);

                erTree.forEach((itemErTreeNode) => {
                    let uiTree = {
                        key: itemErTreeNode.uuid,
                        title: itemErTreeNode.node_zhname,
                        children: [],
                        tag: {
                            nodeType: itemErTreeNode.node_type
                        }
                    }

                    if (itemErTreeNode.node_parent_id === -1) {
                        treeDataTableErs.push(uiTree);
                    } else {
                        this.getCommTreeNode(treeDataTableErs, this.gCurrent.erTreeNode.id, uiTree);
                    }
                });

                this.setState({
                    treeDataTableErs: treeDataTableErs
                })
                break
            case "update":
                treeDataTableErs = lodash.cloneDeep(this.state.treeDataTableErs);

                // this.setProjectTitle(treeDataTableErTrees, erTree.id, erTree.node_zhname);

                this.setState({
                    isTableErTreeEditing: false,
                    treeDataTableErs: treeDataTableErs
                })
                break
            case "delete":
                treeDataTableErs = lodash.cloneDeep(this.state.treeDataTableErs);

                // this.deleteProject(treeDataTableErTrees, this.gCurrent.project.id);
                this.gCurrent.erTreeNode = null;

                this.setState({
                    treeDataTableErs: treeDataTableErs
                })
                break
            default:
                break;
        }
    }

    // >>>>> ui update table
    uiUpdateTable(table, what) {
        let treeDataTablesKnown = lodash.cloneDeep(this.state.treeDataTablesKnown);

        switch (what) {
            case "add":
                let uiTable = {
                    key: table.table_id,
                    title: table.table_name,
                    children: [],
                    tag: {
                        nodeType: "table"
                    }
                };
                treeDataTablesKnown.push(uiTable);

                this.setState({
                    treeDataTablesKnown: treeDataTablesKnown
                }, () => {
                    this.gCurrent.tableId = table.table_id;
                })
                break
            case "update":
                for (let i = 0; i < treeDataTablesKnown.length; i++) {
                    if (treeDataTablesKnown[i].key === table.table_id) {
                        treeDataTablesKnown[i].title = table.table_name;
                        break
                    }
                }

                this.setState({
                    treeDataTablesKnown: treeDataTablesKnown
                });
                break
            case "delete":
                break
            default:
                break
        }
    }

    // >>>>> ds update table
    dsUpdateTable(table, what) {
        switch (what) {
            case "add":
                table.columns = [];
                table.indexes = [];
                table.partitions = [];
                table.relations = [];
                this.gMap.tables.set(table.table_id, table);
                this.gData.tables.push(table);

                if (this.gMap.tablesByLetter.has(this.gCurrent.letterSelected)) {
                    this.gMap.tablesByLetter.get(this.gCurrent.letterSelected).tables.push(table.table_id);
                } else {
                    this.gMap.tablesByLetter.set(this.gCurrent.letterSelected, {tables: [table.table_id]});
                }
                break
            case "update":
                this.gMap.tables.get(table.table_id).table_name = table.table_name;
                break
            case "delete":
                break
            default:
                break
        }
    }

    doAddTableColumn(params) {
        this.restAddTableColumn(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTableColumn(result.data.data, "add");
                    this.dsUpdateTableColumn(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableColumn(params) {
        this.restUpdateTableColumn(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTableColumn(result.data.data, "update");
                    this.dsUpdateTableColumn(result.data.data, "update");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableColumn(params) {
        this.restDeleteTableColumn(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    // >>>>> ui update table column
    uiUpdateTableColumn(column, what) {
        let dsColumns = lodash.cloneDeep(this.state.dsColumns);

        switch (what) {
            case "add":
                column.key = column.column_id;

                dsColumns.push(lodash.cloneDeep(column));

                this.setState({
                    pageSizeColumns: dsColumns.length,
                    dsColumns: dsColumns
                })
                break
            case "update":
                for (let i = 0; i < dsColumns.length; i++) {
                    if (dsColumns[i].column_id === column.column_id) {
                        dsColumns[i].column_name = column.column_name;
                        dsColumns[i].data_type = column.data_type;
                        dsColumns[i].data_length = column.data_length;
                        dsColumns[i].primary_flag = column.primary_flag;
                        dsColumns[i].nullable_flag = column.nullable_flag;
                        dsColumns[i].data_default = column.data_default;
                        dsColumns[i].split_flag = column.split_flag;
                        dsColumns[i].repeat_flag = column.repeat_flag;
                        dsColumns[i].column_desc = column.column_desc;
                        break
                    }
                }
                this.setState({
                    dsColumns: dsColumns
                })
                break
            case "delete":
                break
            default:
                break
        }
    }

    // >>>>> ds update table column
    dsUpdateTableColumn(column, what) {
        switch (what) {
            case "add":
                this.gMap.columns.set(column.column_id, column);
                if (this.gMap.tables.has(column.table_id)) {
                    this.gMap.tables.get(column.table_id).columns.push(column.column_id);
                }
                break
            case "update":
                let myColumn = this.gMap.columns.get(column.column_id);
                myColumn.column_name = column.column_name;
                myColumn.data_type = column.data_type;
                myColumn.data_length = column.data_length;
                myColumn.primary_flag = column.primary_flag;
                myColumn.nullable_flag = column.nullable_flag;
                myColumn.data_default = column.data_default;
                myColumn.split_flag = column.split_flag;
                myColumn.repeat_flag = column.repeat_flag;
                myColumn.column_desc = column.column_desc;
                break
            case "delete":
                break
            default:
                break
        }
    }

    doAddTableIndex(params) {
        this.restAddTableIndex(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTableIndex(result.data.data, "add");
                    //this.dsUpdateTableIndex(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableIndex(params) {
        this.restUpdateTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableIndex(params) {
        this.restDeleteTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doAddTableIndexColumn(params) {
        this.restAddTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    this.uiUpdateTable(result.data.data, "add");
                    this.dsUpdateTable(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doUpdateTableIndexColumn(params) {
        this.restUpdateTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    doDeleteTableIndexColumn(params) {
        this.restDeleteTable(params).then((result) => {
            if (result.status === 200) {
                if (result.data.success) {
                    // this.uiUpdateProjectKpi(result.data.data, "add");
                    // this.dsUpdateProjectKpi(result.data.data, "add");
                    this.context.showMessage("成功，内部ID为：" + result.data.data.id);
                } else {
                    this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
                }
            } else {
                this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            }
        });
    }

    uiUpdateTableIndex(index, what) {
        switch (what) {
            case "add":
                let dsIndexes = lodash.cloneDeep(this.state.dsIndexes);
                index.key = index.id;

                dsIndexes.push(lodash.cloneDeep(index));

                this.setState({
                    pageSizeIndexes: dsIndexes.length,
                    dsIndexes: dsIndexes
                })
                break
            case "update":
                break
            case "delete":
                break
            default:
                break
        }
    }

    dsUpdateTableIndex(table, what) {
        switch (what) {
            case "add":
                this.gMap.tables.set(table.table_id, table);
                this.gMap.tablesByLetter.get(this.gCurrent.letterSelected).tables.push(table.table_id);
                break
            case "update":
                break
            case "delete":
                break
            default:
                break
        }
    }

    uiUpdateTableIndexColumn(column, what) {
        switch (what) {
            case "add":
                let dsColumns = lodash.cloneDeep(this.state.dsColumns);
                column.key = column.column_id;

                dsColumns.push(lodash.cloneDeep(column));

                this.setState({
                    pageSizeColumns: dsColumns.length,
                    dsColumns: dsColumns
                })
                break
            case "update":
                break
            case "delete":
                break
            default:
                break
        }
    }

    dsUpdateTableIndexColumn(table, what) {
        switch (what) {
            case "add":
                this.gMap.tables.set(table.table_id, table);
                this.gMap.tablesByLetter.get(this.gCurrent.letterSelected).tables.push(table.table_id);
                break
            case "update":
                break
            case "delete":
                break
            default:
                break
        }
    }

    showProductTables() {
        this.setState({
            treeDataTablesKnown: []
        })
    }

    showModuleTables() {
        if ((this.gCurrent.productsNodeSelectedType === "module") && (this.gCurrent.dbUserId !== -1)) {
            let setLetters = new Set();
            let mapTablesByLetter = new Map();

            this.gData.tables.forEach((itemTable) => {
                let uId = itemTable.db_user_id;
                let mId = itemTable.module_id;
                if ((mId === this.gCurrent.moduleId) && (uId === this.gCurrent.dbUserId)) {
                    //let tId = itemTable.table_id;
                    let firstLetter = itemTable.table_name[0].toUpperCase();

                    //itemTable.columns = [];
                    setLetters.add(firstLetter);

                    if (!mapTablesByLetter.has(firstLetter)) {
                        // mapTable.set(itemTable.table_name, {tableId: tId, columns: []});
                        // mapTablesByLetter.set(firstLetter, {tables: mapTable});
                        mapTablesByLetter.set(firstLetter, {tables: [itemTable.table_id]});
                    } else {
                        // mapTable = mapTablesByLetter.get(firstLetter).tables;
                        // mapTable.set(itemTable.table_name, {tableId: tId, columns: []});
                        mapTablesByLetter.get(firstLetter).tables.push(itemTable.table_id);
                    }

                    // this.gMap.tables.get(tId).columns.forEach((itemColumn) => {
                    //     let tcId = itemColumn;
                    //     let column = this.gMap.columns.get(tcId);
                    //     mapTable.get(itemTable.table_id).columns.push({
                    //         name: column.column_name,
                    //         type: column.data_type,
                    //         length: column.data_length
                    //     });
                    // })
                }

            });

            this.gMap.tablesByLetter = mapTablesByLetter;

            // 生成UI数据
            let letters = Array.from(setLetters).sort();
            let treeDataLettersKnown = [];
            letters.forEach((item) => {
                treeDataLettersKnown.push({
                    key: item,
                    title: item,
                    children: []
                })
            })

            let treeDataTablesKnown = this.doGetTablesByLetter("known", letters[0]);
            this.gCurrent.letterSelected = letters[0];

            this.setState({
                lettersKnownSelectedKeys: [letters[0]],
                treeDataLettersKnown: treeDataLettersKnown,
                treeDataTablesKnown: treeDataTablesKnown
            })
        }
    }

    showProductDbUsers(productLineId) {
        let id = productLineId;
        let dbUsersSelectOptions = [{value: -1, label: "请选择产品线数据库用户"}];

        if (id === undefined) id = this.gCurrent.productLineId

        this.gData.dbUsers.forEach((item) => {
            if (item.product_line_id === id) {
                let option = {
                    value: item.user_id,
                    label: item.user_name
                }
                dbUsersSelectOptions.push(option);
            }
        });

        this.setState({
            dbUserSelected: -1,
            dbUsersSelectOptions: dbUsersSelectOptions
        })

    }

    getTableId(tableName) {

        let myResult = undefined;

        for (let i = 0; i < this.gData.tables.length; i++) {
            let table = this.gData.tables[i];
            if (table.table_name === tableName) {
                myResult = table.table_id;
            }
        }

        return myResult;
    }

    // >>>>> on tree 表名首字母 selected
    onTreeLettersKnownSelected(selectedKeys, info) {
        this.setState({
            treeSelectedKeysTableFirstLetters: selectedKeys
        });

        if (info.selected) {
            this.gCurrent.letterSelected = selectedKeys[0];

            let tablesTreeData = this.doGetTablesByLetter("known", selectedKeys[0]);
            this.setState({
                treeDataTablesKnown: tablesTreeData
            })
        } else {
            this.gCurrent.letterSelected = undefined;
        }
    }

    onTreeProductsExpanded(expandedKeys) {
        this.setState({
            treeExpandedKeysProducts: expandedKeys
        })
    }

    // >>>>> on Tree 产品 selected
    onTreeProductsSelected(selectedKeys, info) {
        this.setState({
            treeSelectedKeysProducts: selectedKeys
        });

        if (info.selected) {
            let ids = selectedKeys[0].toString().split("_");
            let nodeType = info.node.nodeType;
            this.gCurrent.productsNodeSelectedType = nodeType;

            switch (nodeType) {
                case "product_line":
                    this.gCurrent.productLineId = parseInt(ids[0]);
                    this.gCurrent.productId = undefined;
                    this.gCurrent.moduleId = undefined;

                    this.setState({
                        lettersKnownSelectedKeys: [],
                        treeDataLettersKnown: [],
                        treeDataTablesKnown: [],
                        pageSizeColumns: 0,
                        dsColumns: [],
                        pageSizeIndexes: 0,
                        dsIndexes: [],
                        pageSizePartitions: 0,
                        dsPartitions: [],
                        pageSizeRelations: 0,
                        dsRelations: [],
                        tableSql: "",
                    }, this.showProductDbUsers);

                    break
                case "product":
                    this.gCurrent.productId = parseInt(ids[1]);
                    this.gCurrent.moduleId = undefined;
                    if (this.gCurrent.productLineId === undefined) {
                        this.gCurrent.productLineId = parseInt(ids[0]);
                        this.showProductDbUsers();
                    }

                    this.setState({
                        lettersKnownSelectedKeys: [],
                        treeDataLettersKnown: [],
                        treeDataTablesKnown: [],
                        pageSizeColumns: 0,
                        dsColumns: [],
                        pageSizeIndexes: 0,
                        dsIndexes: [],
                        pageSizePartitions: 0,
                        dsPartitions: [],
                        pageSizeRelations: 0,
                        dsRelations: [],
                        tableSql: "",
                    });

                    break
                case "module":
                    this.gCurrent.moduleId = parseInt(ids[2]);
                    if (this.gCurrent.productId === undefined) {
                        this.gCurrent.productId = parseInt(ids[1]);
                    }
                    if (this.gCurrent.productLineId === undefined) {
                        this.gCurrent.productLineId = parseInt(ids[0]);
                        this.showProductDbUsers();
                    }

                    this.setState({
                        lettersKnownSelectedKeys: [],
                        treeDataLettersKnown: [],
                        treeDataTablesKnown: [],
                        pageSizeColumns: 0,
                        dsColumns: [],
                        pageSizeIndexes: 0,
                        dsIndexes: [],
                        pageSizePartitions: 0,
                        dsPartitions: [],
                        pageSizeRelations: 0,
                        dsRelations: [],
                        tableSql: "",
                    }, this.showModuleTables);

                    break
                default:
                    break
            }
        } else {
            this.gCurrent.productLineId = undefined;
            this.gCurrent.productId = undefined;
            this.gCurrent.moduleId = undefined;
            this.gCurrent.letterSelected = undefined;
            this.gCurrent.tableId = undefined;

            this.setState({
                lettersKnownSelectedKeys: [],
                treeDataLettersKnown: [],
                treeDataTablesKnown: [],
                pageSizeColumns: 0,
                dsColumns: [],
                pageSizeIndexes: 0,
                dsIndexes: [],
                pageSizePartitions: 0,
                dsPartitions: [],
                pageSizeRelations: 0,
                dsRelations: [],
                tableSql: "",
            });
        }


    };

    showTableDetail() {
        let myColumn = new TadTableColumn();
        let myIndex = new TadTableIndex();
        let myIndexColumn = new TadTableIndexColumn();
        let myPartition = new TadTablePartition();
        let myRelation = new TadTableRelation();

        let tableId = this.gCurrent.tableId;
        myColumn.table_id = tableId;
        myIndex.table_id = tableId;
        myIndexColumn.table_id = tableId;
        myPartition.table_id = tableId;
        myPartition.key = tableId;
        myPartition.partitionColumn = this.gMap.tables.get(tableId).partition_column;
        myPartition.partitionType = this.gMap.tables.get(tableId).partition_type;
        myPartition.partitionNames = [];
        myPartition.partitionHighValues = [];
        myRelation.s_table_id = this.gCurrent.tableId;

        axios.all([
            this.doGetTablePropertyColumns(myColumn),
            this.doGetTablePropertyIndexes(myIndex),
            this.doGetTablePropertyIndexColumns(myIndexColumn),
            this.doGetTablePropertyPartitions(myPartition),
            this.doGetTablePropertyRelations(myRelation)
        ]).then(axios.spread((
            columns,
            indexes,
            indexColumns,
            partitions,
            relations) => {

            let pageSizeColumns = columns.data.data.length;
            let dsColumns = [];
            let pageSizeIndexes = indexes.data.data.length;
            let dsIndexes = [];
            let dsIndexColumns = [];
            let pageSizePartitions = partitions.data.data.length;
            let dsPartitions = [];
            let pageSizeRelations = relations.data.data.length;
            let dsRelations = [];

            let table = this.gMap.tables.get(this.gCurrent.tableId);

            columns.data.data.forEach((item) => {
                let uiObject = item;
                uiObject.key = item.column_id;
                dsColumns.push(uiObject);
            })

            let indexSql = "";
            if (indexes.data.data.length > 0) {
                indexes.data.data.forEach((item) => {
                    let uiObject = item;
                    uiObject.key = item.id;
                    uiObject.columns = [];

                    indexSql += 'CREATE INDEX "' + item.index_name + '" ON "' + table.table_name + '" (\n';
                    for (let i = 0; i < indexColumns.data.data.length; i++) {
                        let indexName = indexColumns.data.data[i].index_name;
                        if (indexName === item.index_name) {
                            let columnName = indexColumns.data.data[i].column_name;
                            let descend = indexColumns.data.data[i].descend;
                            let columnPosition = indexColumns.data.data[i].column_position;
                            uiObject.columns.push({
                                columnName: columnName,
                                descend: descend,
                                columnPosition: columnPosition
                            });
                            indexSql += '\t"' + columnName + '",\n';
                        }
                    }
                    dsIndexes.push(uiObject);
                    indexSql = indexSql.substr(0, indexSql.length - 2);
                    indexSql += '\n);\n\n'
                });

                indexColumns.data.data.forEach((item) => {
                    dsIndexColumns.push(item);
                });
            }

            // let partitionSql = "";
            if (partitions.data.data.length > 0) {
                switch (myPartition.partition_type) {
                    case "range":
                        // partitionSql += 'PARTITION BY ' + myPartition.partition_type.toUpperCase() + '(' + myPartition.partition_column + ') (\n';
                        partitions.data.data.forEach((item) => {
                            myPartition.partitionNames.push(item.partition_name);
                            myPartition.partitionHighValues.push(item.high_value);
                            // partitionSql += '\tPARTITION "' + item.partition_name + '" VALUES LESS THAN (' + item.high_value + '),\n';
                        })
                        break
                    case "list":
                        break
                    case "hash":
                        break
                    default:
                        break
                }
                dsPartitions.push(myPartition);
                // partitionSql = partitionSql.substr(0, partitionSql.length - 2);
                // partitionSql += '\n);\n\n';
            }

            relations.data.data.forEach((item) => {
                let uiObject = item;
                uiObject.key = item.id;
                dsRelations.push(uiObject);
            })

            this.setState({
                pageSizeColumns: pageSizeColumns,
                dsColumns: dsColumns,
                pageSizeIndexes: pageSizeIndexes,
                dsIndexes: dsIndexes,
                pageSizePartitions: pageSizePartitions,
                dsPartitions: dsPartitions,
                pageSizeRelations: pageSizeRelations,
                dsRelations: dsRelations,
                tableSql: this.getTableSql(table),
                // domTableSql: domTableSql
            })
        }));
    }

    //todo <<<<< now >>>>> on Tree 在线库表 列表 selected
    onTreeTablesOnlineSelected(selectedKeys, info) {
        //console.log(selectedKeys);
        let connection = this.gMap.connections.get(this.gCurrent.onlineConnectionId);
        //console.log(this.gCurrent);
        //let myTable = this.gMap.tables.get(this.gCurrent.tableId);
        connection.tag = {
            tableName: selectedKeys[0]
        };

        // dataSource={this.state.dsRecords}
        // columns={this.state.columnsRecord}

        this.restGetTableRecords(connection).then((result) => {
            if (result.status === 200) {
                console.log(result.data);
                if (result.data.success) {
                    console.log(result.data);
                    let recordsDynamic = lodash.cloneDeep(result.data.data[0]);
                    let columns = lodash.cloneDeep(result.data.data[1]);

                    let columnsDynamic = [];
                    columns.forEach((itemColumn) => {
                        columnsDynamic.push({
                            title: itemColumn.column_name,
                            dataIndex: itemColumn.column_name,
                            key: itemColumn.column_name,
                            // className: "clsColumnColumnName",
                            // render: (text, record) => {
                            //     if (itemColumn.data_type === "varchar") {
                            //         if (text.length > 10)
                            //             return text.substr(0, 10) + "..."
                            //         else
                            //             return text
                            //     } else {
                            //         return text
                            //     }
                            // }
                        });
                    });
                    console.log(recordsDynamic, columnsDynamic);
                    this.setState({
                        dsRecords: recordsDynamic,
                        columnsRecord: columnsDynamic
                    })
                } else {
                    this.context.showMessage(result.data.code);
                }
            }
        });

    };

    onTreeTablesKnownSelected(selectedKeys, info) {
        // if (selectedKeys[0] === undefined) return;
        // if (info.node.tag.nodeType !== "table") return;

        this.setState({
            treeSelectedKeysTables: selectedKeys
        });

        if (info.selected && info.node.tag.nodeType === "table") {
            this.gCurrent.tableId = info.node.key;

            this.showTableDetail();
        } else {
            this.gCurrent.tableId = undefined;

            this.setState({
                pageSizeColumns: 0,
                dsColumns: [],
                pageSizeIndexes: 0,
                dsIndexes: [],
                pageSizePartitions: 0,
                dsPartitions: [],
                pageSizeRelations: 0,
                dsRelations: [],
                tableSql: "",
            });
        }

    };

    // >>>>> on Tree ER图树 selected
    onTreeErDiagramSelected(selectedKeys, info) {
        if (info.selected) {
            this.gCurrent.erTreeNode = {
                id: selectedKeys[0],
                nodeType: info.node.tag.nodeType,
            }

        }

        if (info.selected && info.node.tag.nodeType === "NODE_ER_TABLE") {
            const nodes = this.x6Graph.getNodes();
            nodes.forEach((itemNode) => {
                let nodeData = itemNode.getData();
                if (nodeData.nodeType.toUpperCase() === "TABLE") {
                    if (nodeData.nodeId === selectedKeys[0]) {
                        this.x6Graph.scrollToCell(itemNode);
                    }
                }
            })
        }

        if (info.selected && info.node.tag.nodeType === "NODE_ER_DIAGRAM") {
            let nodeId = selectedKeys[0];
            this.gCurrent.erDiagramId = nodeId;

            // 更新树节点中ER图所包含的表
            if (this.gMap.erTablesByDiagram.has(nodeId)) {
                let erTables = this.gMap.erTablesByDiagram.get(nodeId);
                this.gCurrent.erTablesSelected = erTables;
                if (!erTables.isLoaded) {
                    let myErTreeNodes = [];
                    erTables.tables.forEach((itemErTable) => {
                        let myTable = this.gMap.tables.get(itemErTable);
                        let myErTreeNode = {
                            uuid: myTable.table_id,
                            node_zhname: myTable.table_name,
                            node_parent_id: nodeId,
                            node_type: "NODE_ER_TABLE"
                        }
                        myErTreeNodes.push(myErTreeNode);

                        let attrs = erTables.attrs.get(itemErTable);
                        if (!attrs.position_x) attrs.position_x = Math.random() * 1000;
                        if (!attrs.position_y) attrs.position_y = Math.random() * 1000;
                        myTable.positionX = attrs.position_x;
                        myTable.positionY = attrs.position_y;

                        this.x6AddEntityTable(myTable);

                    });
                    this.uiUpdateTableErTree(myErTreeNodes, "adds");
                    erTables.isLoaded = true;
                }

                this.x6Graph.clearCells();
                erTables.tables.forEach((itemErTable) => {
                    let myTable = this.gMap.tables.get(itemErTable);
                    let attrs = erTables.attrs.get(itemErTable);
                    if (attrs.position_x === null) attrs.position_x = Math.random() * 1000;
                    if (attrs.position_y === null) attrs.position_y = Math.random() * 1000;
                    myTable.positionX = attrs.position_x;
                    myTable.positionY = attrs.position_y;
                    this.x6AddEntityTable(myTable);
                });
            }

            // let myTableEr = new TadTableEr();
            // myTableEr.er_id = nodeId;
            // this.restGetTableEr(myTableEr).then((result) => {
            //     if (result.status === 200) {
            //         if (result.data.success) {
            //             if ((result.data.data !== null) && (result.data.data !== undefined)) {
            //                 let content = result.data.data.er_content;
            //                 if (content !== null) {
            //                     let buffer = new Uint8Array(content.data);
            //                     let strJson = new TextDecoder('utf-8').decode(buffer);
            //                     let myJson = JSON.parse(strJson);
            //                     this.x6Graph.fromJSON(myJson);
            //                     this.x6Graph.scrollToContent();
            //
            //                     // >>>>> 监测表结构是否变化，如果变化，增更新ER图
            //                     let tables = [];
            //                     const nodes = this.x6Graph.getNodes();
            //                     nodes.forEach((itemNode) => {
            //                         let nodeData = itemNode.getData();
            //
            //                         if (nodeData.nodeType.toUpperCase() === "TABLE") {
            //                             tables.push({id: nodeData.nodeId, columns: []});
            //                             if (nodeData.nodeId === selectedKeys[0]) {
            //                                 // itemNode.setAttrs({
            //                                 //     body: { fill: '#f5f5f5' },
            //                                 // })
            //                                 this.x6Graph.scrollToCell(itemNode);
            //                             }
            //                             const nodeChildren = itemNode.getChildren();
            //                             nodeChildren.forEach((itemNodeChild) => {
            //                                 const nodeChildData = itemNodeChild.getData();
            //                                 if (nodeChildData.nodeType.toUpperCase() === "TABLE_COLUMN") {
            //                                     tables[tables.length - 1].columns.push(nodeChildData.nodeId);
            //                                 }
            //                             })
            //                         }
            //                     })
            //                     console.log("用于检测表格字段是否发生变化", tables);
            //
            //                     this.context.showMessage("成功，内部ID为：" + result.data.data.id);
            //                 }
            //             }
            //         } else {
            //             this.context.showMessage("调用服务接口出现问题，详情：" + result.data.message);
            //         }
            //     } else {
            //         this.context.showMessage("调用服务接口出现问题，详情：" + result.statusText);
            //     }
            // });
        }
    };


    onSelectDbUsersChanged(value) {

        this.gCurrent.dbUserId = value;
        this.setState({
            productLineDbUserId: value
        });

        if (this.gCurrent.productsNodeSelectedType === "product") {
            this.showProductTables()
        } else if (this.gCurrent.productsNodeSelectedType === "module") {
            this.showModuleTables()
        }
    }

    onSelect(selectedKeys, info) {
        //
    };

    onSelectColumnDataTypeChanged(v) {
        this.gDynamic.columnDataType = v;
    }

    // >>>>> on select X6 Table Column Data Type changed
    onSelectX6TableColumnDataTypeChanged(v) {
        // this.gDynamic.x6TableColumnDataType = v;
        let nodeType = v;
        this.gCurrent.node.setData({
            dataType: v
        })

        switch (nodeType) {
            case "int":
                this.gCurrent.node.addPort({
                    id: 'portLeft',
                    group: "groupLeft",
                    attrs: {
                        circle: {
                            connectionCount: 1,
                            r: 5,
                            magnet: true,
                            stroke: '#AFDEFF',
                            fill: '#FFF',
                            strokeWidth: 1,
                        },
                    },
                });

                this.gCurrent.node.addPort({
                    id: 'portRight',
                    group: "groupRight",
                    attrs: {
                        circle: {
                            connectionCount: 2,
                            r: 5,
                            magnet: true,
                            stroke: '#AFDEFF',
                            fill: '#FFF',
                            strokeWidth: 1,
                        },
                    },
                });
                break
            default:
                this.gCurrent.node.removePort("portLeft");
                this.gCurrent.node.removePort("portRight");
                break
        }
    }

    onTableUnknownChecked(checkedKeys, info) {

        // this.gTableUnknownSelected = info.checkedNodes;
    };

    onTableKnownChecked(checkedKeys, info) {

        // this.gTableKnownSelected = info.checkedNodes;
    };

    // >>>>> on button 添加表 clicked
    onButtonAddTableClicked() {
        let myTable = new TadTable();

        if (this.gCurrent.letterSelected === undefined) {
            this.gCurrent.letterSelected = "T";

            let treeDataTablesKnown = this.doGetTablesByLetter("known", this.gCurrent.letterSelected);

            this.setState({
                treeDataTablesKnown: treeDataTablesKnown
            })
        }
        myTable.table_name = this.gCurrent.letterSelected + "_TABLE_NEW_" + moment().format("YYYYMMDDHHmmss");
        myTable.module_id = this.gCurrent.moduleId;
        myTable.db_user_id = this.gCurrent.dbUserId;

        this.doAddTable(myTable);
    }

    onButtonCloneTableClicked() {
        this.context.showMessage("「复制」功能正在开发，请稍后。");

        // let myTable = new TadTable();
        //
        // if (this.gCurrent.letterSelected === undefined) {
        //     this.gCurrent.letterSelected = "T";
        //
        //     let treeDataTablesKnown = this.doGetTablesByLetter("known", this.gCurrent.letterSelected);
        //
        //     this.setState({
        //         treeDataTablesKnown: treeDataTablesKnown
        //     })
        // }
        // myTable.table_name = this.gCurrent.letterSelected + "_TABLE_NEW_" + moment().format("YYYYMMDDHHmmss");
        // myTable.module_id = this.gCurrent.moduleId;
        // myTable.db_user_id = this.gCurrent.dbUserId;
        //
        // this.doAddTable(myTable);
    }

    onInputTableNameChanged(e) {
        this.gDynamic.tableName = e.target.value;
    }

    onButtonTableNameEditingConfirmClicked() {
        let table = new TadTable();

        table.table_id = this.gCurrent.tableId;
        table.table_name = this.gDynamic.tableName;

        this.doUpdateTable(table);

        this.gDynamic.tableName = undefined;
        this.setState({
            isTableNameEditing: false
        })
    }

    onButtonTableNameEditingCancelClicked() {
        let treeDataTablesKnown = lodash.cloneDeep(this.state.treeDataTablesKnown);
        let title = this.gMap.tables.get(this.gCurrent.tableId).table_name;

        this.setTableTitle(treeDataTablesKnown, this.gCurrent.tableId, title);

        this.setState({
            isTableNameEditing: false,
            treeDataTablesKnown: treeDataTablesKnown
        })

    }

    //todo <<<<< now >>>>> on button 获取(目标数据库库表)数据 clicked
    onButtonGetTableDataClicked(e) {
        let connection = this.gMap.connections.get(this.gCurrent.dbTarget.connectionId);
        console.log(this.gCurrent);
        let myTable = this.gMap.tables.get(this.gCurrent.tableId);
        connection.tag = {
            tableName: myTable.table_name
        };

        this.restGetTableRecords(connection).then((result) => {
            if (result.status === 200) {
                console.log(result.data);
                if (result.data.success) {
                    console.log(result.data);
                    let recordsDynamic = lodash.cloneDeep(result.data.data[0]);
                    let columns = lodash.cloneDeep(result.data.data[1]);

                    let columnsDynamic = [];
                    columns.forEach((itemColumn) => {
                        columnsDynamic.push({
                            title: itemColumn.column_name,
                            dataIndex: itemColumn.column_name,
                            key: itemColumn.column_name,
                            // className: "clsColumnColumnName",
                            // render: (text, record) => {
                            //     if (itemColumn.data_type === "varchar") {
                            //         if (text.length > 10)
                            //             return text.substr(0, 10) + "..."
                            //         else
                            //             return text
                            //     } else {
                            //         return text
                            //     }
                            // }
                        });
                    });
                    console.log(recordsDynamic, columnsDynamic);
                    this.setState({
                        recordsDynamic: recordsDynamic,
                        columnsDynamic: columnsDynamic
                    })
                } else {
                    this.context.showMessage(result.data.code);
                }
            }
        });
    }

    onInputColumnNameChanged(e) {
        this.gDynamic.columnName = e.target.value;
    }

    onInputColumnDataLengthChanged(e) {
        this.gDynamic.columnDataLength = e.target.value;
    }

    onInputColumnDataDefaultChanged(e) {
        this.gDynamic.columnDataDefault = e.target.value;
    }

    onInputColumnSplitFlagChanged(e) {
        this.gDynamic.columnSplitFlag = e.target.value;
    }

    onInputColumnRepeatFlagChanged(e) {
        this.gDynamic.columnRepeatFlag = e.target.value;
    }

    onInputColumnDescChanged(e) {
        this.gDynamic.columnDesc = e.target.value;
    }

    onCheckboxColumnPrimaryFlagChanged(e) {
        this.gDynamic.columnPrimaryFlag = e.target.checked ? "yes" : "no";
    }

    onCheckboxColumnNullableFlagChanged(e) {
        this.gDynamic.columnNullableFlag = e.target.checked ? "yes" : "no";
    }

    onButtonColumnEditingConfirmClicked() {
        // let table = new TadTable();
        //
        // table.table_id = this.gCurrent.tableId;
        // table.table_name = this.gDynamic.tableName;
        //
        // this.doUpdateTable(table);
        //
        this.gDynamic.tableName = undefined;
        this.setState({
            isColumnEditing: false
        })
    }

    onButtonColumnEditingCancelClicked() {
        // let treeDataTablesKnown = lodash.cloneDeep(this.state.treeDataTablesKnown);
        // let title = this.gMap.tables.get(this.gCurrent.tableId).table_name;
        //
        // this.setTableTitle(treeDataTablesKnown, this.gCurrent.tableId, title);

        this.setState({
            isColumnEditing: false,
            // treeDataTablesKnown: treeDataTablesKnown
        })

    }

    onButtonListTreeClicked(e) {
        if (this.state.radioDataSource === 2) return

        let btnId = e.target.id === "" ? e.target.parentElement.id : e.target.id;

        this.setState({
            isErDiagram: false,
            tabNavSelected: btnId,
        })
    }

    onButtonErDiagramClicked(e) {
        if (this.state.radioDataSource === 2) return

        let btnId = e.target.id === "" ? e.target.parentElement.id : e.target.id;

        this.setState({
            isErDiagram: true,
            tabNavSelected: btnId,
        })
    }

    setTableTitle(treeNodes, id, title) {
        for (let i = 0; i < treeNodes.length; i++) {
            if (treeNodes[i].key === id) {
                treeNodes[i].title = title;
                return
            }
        }
    }

    // >>>>> set table name editable
    setTableNameEditable(treeNodes, id) {
        for (let i = 0; i < treeNodes.length; i++) {
            if (treeNodes[i].key === id) {
                treeNodes[i].title = <div className="tableNameEditing">
                    <Input defaultValue={treeNodes[i].title} onChange={this.onInputTableNameChanged} size={"small"}/>
                    <Button onClick={this.onButtonTableNameEditingConfirmClicked} size={"small"}
                            type={"primary"}>确认</Button>
                    <Button onClick={this.onButtonTableNameEditingCancelClicked} size={"small"}
                            type={"primary"}>放弃</Button></div>;
                break
            }
        }
    }

    onButtonRenameTableClicked() {
        if (this.gCurrent.tableId !== undefined) {
            let treeDataTablesKnown = lodash.cloneDeep(this.state.treeDataTablesKnown);
            this.setTableNameEditable(treeDataTablesKnown, this.gCurrent.tableId);

            this.setState({
                isTableNameEditing: true,
                treeDataTablesKnown: treeDataTablesKnown
            })
        }

    }

    onButtonDeleteTableClicked(e) {

    }

    // >>>>> on button 添加表字段 clicked
    onButtonAddColumnClicked() {
        let myTableColumn = new TadTableColumn();
        myTableColumn.table_id = this.gCurrent.tableId;
        myTableColumn.column_name = "TABLE_COLUMN_NEW";

        this.doAddTableColumn(myTableColumn);
    }

    // >>>>> on Button 修改字段属性 clicked
    onButtonAlterColumnClicked() {

        this.setState({
            isColumnEditing: true,
            tableColumnEditingKey: this.gCurrent.columnId,
            isShownButtonAddIndex: "none",
            isShownButtonDeleteIndex: "none",
            isShownButtonAlterIndexConfirm: "block",
            isShownButtonAlterIndexCancel: "block",
        })
    }

    onButtonAlterColumnConfirmClicked() {
        let column = new TadTableColumn();

        column.column_id = this.gCurrent.columnId;

        if (this.gDynamic.columnName !== undefined) column.column_name = this.gDynamic.columnName;
        if (this.gDynamic.columnDataType !== undefined) column.data_type = this.gDynamic.columnDataType;
        if (this.gDynamic.columnDataLength !== undefined) column.data_length = this.gDynamic.columnDataLength;
        if (this.gDynamic.columnDataDefault !== undefined) column.data_default = this.gDynamic.columnDataDefault;
        if (this.gDynamic.columnSplitFlag !== undefined) column.split_flag = this.gDynamic.columnSplitFlag;
        if (this.gDynamic.columnRepeatFlag !== undefined) column.repeat_flag = this.gDynamic.columnRepeatFlag;
        if (this.gDynamic.columnDesc !== undefined) column.column_desc = this.gDynamic.columnDesc;
        if (this.gDynamic.columnPrimaryFlag !== undefined) column.primary_flag = this.gDynamic.columnPrimaryFlag;
        if (this.gDynamic.columnNullableFlag !== undefined) column.nullable_flag = this.gDynamic.columnNullableFlag;

        this.doUpdateTableColumn(column);

        this.setState({
            isColumnEditing: false,
            tableColumnEditingKey: null,
        })
        /*
        let myIndex = new TadTableIndex();
        myIndex.id = this.state.editingIndex.id;
        myIndex.table_id = this.state.editingIndex.table_id;
        myIndex.index_name = this.state.editingIndex.name;
        myIndex.index_type = this.state.editingIndex.type;
        myIndex.index_columns = this.state.editingIndex.columns;
        myIndex.index_attributes = this.state.editingIndex.attributes;
        myIndex.index_desc = this.state.editingIndex.desc;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index",
            myIndex,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                let dsIndexes = JSON.parse(JSON.stringify(this.state.dsIndexes));

                for (let i = 0; i < dsIndexes.length; i++) {
                    let record = dsIndexes[i];
                    if (record.key === this.state.editingIndex.key) {
                        record.index_name = this.state.editingIndex.name;
                        record.index_type = this.state.editingIndex.type;
                        record.index_columns = this.state.editingIndex.columns;
                        record.index_attributes = this.state.editingIndex.attributes;

                        break
                    }
                }

                this.setState({
                    dsIndexes: dsIndexes,
                    isShownButtonAddIndex: "block",
                    isShownButtonDeleteIndex: "block",
                    isShownButtonAlterIndexConfirm: "none",
                    isShownButtonAlterIndexCancel: "none",
                })
            }
        });
        */
    }

    onButtonAlterColumnCancelClicked() {

        this.setState({
            tableColumnEditingKey: null,
            isColumnEditing: false,
        })
    }

    onButtonDeleteColumnClicked() {

    }

    // >>>>> on button 添加表索引 clicked
    onButtonAddIndexClicked() {
        let myIndex = new TadTableIndex();

        myIndex.table_id = this.gCurrent.tableId;
        myIndex.index_name = "NEW_TABLE_INDEX";

        this.doAddTableIndex(myIndex);
    }

    onButtonAlterIndexClicked() {

        this.setState({
            isShownButtonAddIndex: "none",
            isShownButtonDeleteIndex: "none",
            isShownButtonAlterIndexConfirm: "block",
            isShownButtonAlterIndexCancel: "block",
        })
    }

    onButtonAlterIndexConfirmClicked() {

        let myIndex = new TadTableIndex();
        myIndex.id = this.state.editingIndex.id;
        myIndex.table_id = this.state.editingIndex.table_id;
        myIndex.index_name = this.state.editingIndex.name;
        myIndex.index_type = this.state.editingIndex.type;
        myIndex.index_columns = this.state.editingIndex.columns;
        myIndex.index_attributes = this.state.editingIndex.attributes;
        myIndex.index_desc = this.state.editingIndex.desc;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index",
            myIndex,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                let dsIndexes = JSON.parse(JSON.stringify(this.state.dsIndexes));

                for (let i = 0; i < dsIndexes.length; i++) {
                    let record = dsIndexes[i];
                    if (record.key === this.state.editingIndex.key) {
                        record.index_name = this.state.editingIndex.name;
                        record.index_type = this.state.editingIndex.type;
                        record.index_columns = this.state.editingIndex.columns;
                        record.index_attributes = this.state.editingIndex.attributes;

                        break
                    }
                }

                this.setState({
                    dsIndexes: dsIndexes,
                    isShownButtonAddIndex: "block",
                    isShownButtonDeleteIndex: "block",
                    isShownButtonAlterIndexConfirm: "none",
                    isShownButtonAlterIndexCancel: "none",
                })
            }
        });

    }

    onButtonAlterIndexCancelClicked() {

        this.setState({
            isShownButtonAddIndex: "block",
            isShownButtonDeleteIndex: "block",
            isShownButtonAlterIndexConfirm: "none",
            isShownButtonAlterIndexCancel: "none",
        })
    }

    onButtonDeleteIndexClicked() {

    }

    onButtonAddPartitionClicked() {

        let tableId = this.gCurrent.tableId;
        let partitionId = undefined;

        let myObject = new TadTablePartition();
        myObject.table_id = tableId;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_partition",
            myObject,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                partitionId = data.data.id;
                let uiPartition = data.data;
                uiPartition.key = partitionId;

                let dsPartitions = JSON.parse(JSON.stringify(this.state.dsPartitions));

                dsPartitions.push(uiPartition);
                this.setState({
                    pageSizePartitions: this.state.pageSizePartitions + 1,
                    dsPartitions: dsPartitions
                })
            }
        });
    }

    onButtonAlterPartitionClicked() {

        this.setState({
            isShownButtonAddPartition: "none",
            isShownButtonDeletePartition: "none",
            isShownButtonAlterPartitionConfirm: "block",
            isShownButtonAlterPartitionCancel: "block",
        })
    }

    onButtonAlterPartitionConfirmClicked() {

        let myObject = new TadTablePartition();
        myObject.id = this.state.editingPartition.id;
        myObject.table_id = this.state.editingPartition.table_id;
        myObject.partition_type = this.state.editingPartition.type;
        myObject.partition_column = this.state.editingPartition.column;
        myObject.partition_name = this.state.editingPartition.name;
        myObject.partition_operator = this.state.editingPartition.operator;
        myObject.partition_tablespace = this.state.editingPartition.tablespace;
        myObject.partition_desc = this.state.editingPartition.desc;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_partition",
            myObject,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                let dsPartitions = JSON.parse(JSON.stringify(this.state.dsPartitions));

                for (let i = 0; i < dsPartitions.length; i++) {
                    let record = dsPartitions[i];
                    if (record.key === this.state.editingPartition.key) {
                        record.id = this.state.editingPartition.id;
                        record.table_id = this.state.editingPartition.table_id;
                        record.partition_type = this.state.editingPartition.type;
                        record.partition_column = this.state.editingPartition.column;
                        record.partition_name = this.state.editingPartition.name;
                        record.partition_operator = this.state.editingPartition.operator;
                        record.partition_tablespace = this.state.editingPartition.tablespace;
                        record.partition_desc = this.state.editingPartition.desc;

                        break
                    }
                }

                this.setState({
                    dsPartitions: dsPartitions,
                    isShownButtonAddPartition: "block",
                    isShownButtonDeletePartition: "block",
                    isShownButtonAlterPartitionConfirm: "none",
                    isShownButtonAlterPartitionCancel: "none",
                })
            }
        });

    }

    onButtonAlterPartitionCancelClicked() {

        this.setState({
            isShownButtonAddPartition: "block",
            isShownButtonDeletePartition: "block",
            isShownButtonAlterPartitionConfirm: "none",
            isShownButtonAlterPartitionCancel: "none",
        })
    }

    onButtonDeletePartitionClicked() {

    }

    // >>>>> on button 添加表关系 clicked
    onButtonAddRelationClicked() {
        // let tableId = this.gCurrent.tableId;
        // let relationId = undefined;
        //
        // let myRelation = new TadTableRelation();
        // myRelation.s_table_id = tableId;
        //
        // axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_relation",
        //     myRelation,
        //     {headers: {'Content-Type': 'application/json'}}
        // ).then((response) => {
        //     let data = response.data;
        //
        //     if (data.success) {
        //         relationId = data.data.id;
        //         let uiRelation = data.data;
        //         uiRelation.key = relationId;
        //
        //         let dsRelations = JSON.parse(JSON.stringify(this.state.dsRelations));
        //
        //         dsRelations.push(uiRelation);
        //         this.setState({
        //             pageSizeRelations: this.state.pageSizeRelations + 1,
        //             dsRelations: dsRelations
        //         })
        //     }
        // });
    }

    onButtonAlterRelationClicked() {

        this.setState({
            isShownButtonAddIndex: "none",
            isShownButtonDeleteIndex: "none",
            isShownButtonAlterIndexConfirm: "block",
            isShownButtonAlterIndexCancel: "block",
        })
    }

    onButtonAlterRelationConfirmClicked() {

        let myIndex = new TadTableIndex();
        myIndex.id = this.state.editingIndex.id;
        myIndex.table_id = this.state.editingIndex.table_id;
        myIndex.index_name = this.state.editingIndex.name;
        myIndex.index_type = this.state.editingIndex.type;
        myIndex.index_columns = this.state.editingIndex.columns;
        myIndex.index_attributes = this.state.editingIndex.attributes;
        myIndex.index_desc = this.state.editingIndex.desc;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index",
            myIndex,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                let dsIndexes = JSON.parse(JSON.stringify(this.state.dsIndexes));

                for (let i = 0; i < dsIndexes.length; i++) {
                    let record = dsIndexes[i];
                    if (record.key === this.state.editingIndex.key) {
                        record.index_name = this.state.editingIndex.name;
                        record.index_type = this.state.editingIndex.type;
                        record.index_columns = this.state.editingIndex.columns;
                        record.index_attributes = this.state.editingIndex.attributes;

                        break
                    }
                }

                this.setState({
                    dsIndexes: dsIndexes,
                    isShownButtonAddIndex: "block",
                    isShownButtonDeleteIndex: "block",
                    isShownButtonAlterIndexConfirm: "none",
                    isShownButtonAlterIndexCancel: "none",
                })
            }
        });

    }

    onButtonAlterRelationCancelClicked() {

        this.setState({
            isShownButtonAddIndex: "block",
            isShownButtonDeleteIndex: "block",
            isShownButtonAlterIndexConfirm: "none",
            isShownButtonAlterIndexCancel: "none",
        })
    }

    onButtonDeleteRelationClicked() {

    }

    onButtonProductsChangeComponentSizeClicked() {
        if (this.state.radioDataSource === 2) return

        let styleLayout = "NNN";

        if (this.state.styleLayout === "NNN")
            styleLayout = "SNN";
        else if (this.state.styleLayout === "SNN")
            styleLayout = "NNN";
        else if (this.state.styleLayout === "SSN")
            styleLayout = "NNN";

        this.setState({
            styleLayout: styleLayout
        })
    }

    onButtonTablesChangeComponentSizeClicked() {
        let styleLayout = "NNN";

        if (this.state.styleLayout === "NNN")
            styleLayout = "SSN";
        else if (this.state.styleLayout === "SNN")
            styleLayout = "SSN";
        else if (this.state.styleLayout === "SSN")
            styleLayout = "SNN";

        this.setState({
            styleLayout: styleLayout
        });
    }

    onButtonAddRecordClicked() {
        let tableId = this.gCurrent.tableId;
        let indexId = undefined;

        let myIndex = {
            id: indexId,
            table_id: tableId,
            index_name: "新增索引",
            index_type: "normal",
            index_columns: "",
            index_attributes: "",
            index_desc: ""
        }

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/add_table_index",
            myIndex,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                indexId = data.data.id;
                let uiIndex = {
                    key: indexId,
                    index_name: "新增索引",
                    index_type: "normal",
                    index_columns: "",
                    index_attributes: "",
                    index_desc: ""
                }

                let dsIndexes = JSON.parse(JSON.stringify(this.state.dsIndexes));

                dsIndexes.push(uiIndex);
                this.setState({
                    pageSizeTableIndexes: this.state.pageSizeTableIndexes + 1,
                    dsIndexes: dsIndexes
                })
            }
        });
    }

    onButtonAlterRecordClicked() {

        this.setState({
            isShownButtonAddIndex: "none",
            isShownButtonDeleteIndex: "none",
            isShownButtonAlterIndexConfirm: "block",
            isShownButtonAlterIndexCancel: "block",
        })
    }

    onButtonAlterRecordConfirmClicked() {

        let myIndex = new TadTableIndex();
        myIndex.id = this.state.editingIndex.id;
        myIndex.table_id = this.state.editingIndex.table_id;
        myIndex.index_name = this.state.editingIndex.name;
        myIndex.index_type = this.state.editingIndex.type;
        myIndex.index_columns = this.state.editingIndex.columns;
        myIndex.index_attributes = this.state.editingIndex.attributes;
        myIndex.index_desc = this.state.editingIndex.desc;

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/update_table_index",
            myIndex,
            {headers: {'Content-Type': 'application/json'}}
        ).then((response) => {
            let data = response.data;

            if (data.success) {
                let dsIndexes = JSON.parse(JSON.stringify(this.state.dsIndexes));

                for (let i = 0; i < dsIndexes.length; i++) {
                    let record = dsIndexes[i];
                    if (record.key === this.state.editingIndex.key) {
                        record.index_name = this.state.editingIndex.name;
                        record.index_type = this.state.editingIndex.type;
                        record.index_columns = this.state.editingIndex.columns;
                        record.index_attributes = this.state.editingIndex.attributes;

                        break
                    }
                }

                this.setState({
                    dsIndexes: dsIndexes,
                    isShownButtonAddIndex: "block",
                    isShownButtonDeleteIndex: "block",
                    isShownButtonAlterIndexConfirm: "none",
                    isShownButtonAlterIndexCancel: "none",
                })
            }
        });

    }

    onButtonAlterRecordCancelClicked() {

        this.setState({
            isShownButtonAddIndex: "block",
            isShownButtonDeleteIndex: "block",
            isShownButtonAlterIndexConfirm: "none",
            isShownButtonAlterIndexCancel: "none",
        })
    }

    onButtonDeleteRecordClicked() {

    }

    onRowColumnSelected = {
        onChange: (selectedRowKeys, selectedRows) => {
            this.gCurrent.columnId = selectedRowKeys[0];

            let isShownButtonAlterIndexConfirm = this.state.isShownButtonAlterIndexConfirm;
            if (isShownButtonAlterIndexConfirm === "block") return false;

            let arrPropertyName = Object.keys(selectedRows[0]);
            let mapValues = new Map();
            for (let item of arrPropertyName) {
                mapValues.set(item, selectedRows[0][item])
            }

            this.gCurrent.selectedRowsTablePropertyIndex = selectedRows[0];

            let editingIndex = JSON.parse(JSON.stringify(this.state.editingIndex));

            editingIndex.key = selectedRows[0].key;
            editingIndex.id = selectedRows[0].id;
            editingIndex.table_id = selectedRows[0].table_id;
            editingIndex.name = selectedRows[0].index_name;
            editingIndex.type = selectedRows[0].index_type;
            editingIndex.columns = selectedRows[0].index_columns;
            editingIndex.attributes = selectedRows[0].index_attributes;
            editingIndex.desc = selectedRows[0].index_desc;

            this.setState({
                editingIndex: editingIndex,
                isEditingKeyIndex: selectedRows[0].key
            })
        },
        renderCell: (checked, record, index, originNode) => {
            return (
                <Fragment>
                    {this.state.isShownButtonAlterColumnConfirm === "none" && (originNode)}
                </Fragment>
            )
        }
    }

    onRowIndexSelected = {
        onChange: (selectedRowKeys, selectedRows) => {
            let isShownButtonAlterIndexConfirm = this.state.isShownButtonAlterIndexConfirm;
            if (isShownButtonAlterIndexConfirm === "block") return false;

            let arrPropertyName = Object.keys(selectedRows[0]);
            let mapValues = new Map();
            for (let item of arrPropertyName) {
                mapValues.set(item, selectedRows[0][item])
            }

            this.gCurrent.selectedRowsTablePropertyIndex = selectedRows[0];

            let editingIndex = JSON.parse(JSON.stringify(this.state.editingIndex));

            editingIndex.key = selectedRows[0].key;
            editingIndex.id = selectedRows[0].id;
            editingIndex.table_id = selectedRows[0].table_id;
            editingIndex.name = selectedRows[0].index_name;
            editingIndex.type = selectedRows[0].index_type;
            editingIndex.columns = selectedRows[0].index_columns;
            editingIndex.attributes = selectedRows[0].index_attributes;
            editingIndex.desc = selectedRows[0].index_desc;

            this.setState({
                editingIndex: editingIndex,
                isEditingKeyIndex: selectedRows[0].key
            })
        },
        renderCell: (checked, record, index, originNode) => {
            return (
                <Fragment>
                    {this.state.isShownButtonAlterIndexConfirm === "none" && (originNode)}
                </Fragment>
            )
        }
    }

    onRowPartitionSelected = {
        onChange: (selectedRowKeys, selectedRows) => {
            let isShownButtonAlterPartitionConfirm = this.state.isShownButtonAlterPartitionConfirm;
            if (isShownButtonAlterPartitionConfirm === "block") return false;

            // let arrPropertyName = Object.keys(selectedRows[0]);
            // let mapValues = new Map();
            // for (let item of arrPropertyName) {
            //     mapValues.set(item, selectedRows[0][item])
            // }

            this.gCurrent.selectedRowsPartition = selectedRows[0];

            let editingPartition = JSON.parse(JSON.stringify(this.state.editingPartition));

            editingPartition.key = selectedRows[0].key;
            editingPartition.id = selectedRows[0].id;
            editingPartition.table_id = selectedRows[0].table_id;
            editingPartition.type = selectedRows[0].partition_type;
            editingPartition.column = selectedRows[0].partition_column;
            editingPartition.name = selectedRows[0].partition_name;
            editingPartition.operator = selectedRows[0].partition_operator;
            editingPartition.expression = selectedRows[0].partition_expression;
            editingPartition.tablespace = selectedRows[0].partition_tablespace;
            editingPartition.desc = selectedRows[0].partition_desc;

            this.setState({
                editingPartition: editingPartition,
                isEditingKeyPartition: selectedRows[0].key
            })
        },
        renderCell: (checked, record, index, originNode) => {
            return (
                <Fragment>
                    {this.state.isShownButtonAlterPartitionConfirm === "none" && (originNode)}
                </Fragment>
            )
        }
    }

    onRowRelationSelected = {
        onChange: (selectedRowKeys, selectedRows) => {
            let isShownButtonAlterIndexConfirm = this.state.isShownButtonAlterIndexConfirm;
            if (isShownButtonAlterIndexConfirm === "block") return false;

            let arrPropertyName = Object.keys(selectedRows[0]);
            let mapValues = new Map();
            for (let item of arrPropertyName) {
                mapValues.set(item, selectedRows[0][item])
            }

            this.gCurrent.selectedRowsTablePropertyIndex = selectedRows[0];

            let editingIndex = JSON.parse(JSON.stringify(this.state.editingIndex));

            editingIndex.key = selectedRows[0].key;
            editingIndex.id = selectedRows[0].id;
            editingIndex.table_id = selectedRows[0].table_id;
            editingIndex.name = selectedRows[0].index_name;
            editingIndex.type = selectedRows[0].index_type;
            editingIndex.columns = selectedRows[0].index_columns;
            editingIndex.attributes = selectedRows[0].index_attributes;
            editingIndex.desc = selectedRows[0].index_desc;

            this.setState({
                editingIndex: editingIndex,
                isEditingKeyIndex: selectedRows[0].key
            })
        },
        renderCell: (checked, record, index, originNode) => {
            return (
                <Fragment>
                    {this.state.isShownButtonAlterRelationConfirm === "none" && (originNode)}
                </Fragment>
            )
        }
    }

    onRowRecordSelected = {
        onChange: (selectedRowKeys, selectedRows) => {
            let isShownButtonAlterIndexConfirm = this.state.isShownButtonAlterIndexConfirm;
            if (isShownButtonAlterIndexConfirm === "block") return false;

            let arrPropertyName = Object.keys(selectedRows[0]);
            let mapValues = new Map();
            for (let item of arrPropertyName) {
                mapValues.set(item, selectedRows[0][item])
            }

            this.gCurrent.selectedRowsTablePropertyIndex = selectedRows[0];

            let editingIndex = JSON.parse(JSON.stringify(this.state.editingIndex));

            editingIndex.key = selectedRows[0].key;
            editingIndex.id = selectedRows[0].id;
            editingIndex.table_id = selectedRows[0].table_id;
            editingIndex.name = selectedRows[0].index_name;
            editingIndex.type = selectedRows[0].index_type;
            editingIndex.columns = selectedRows[0].index_columns;
            editingIndex.attributes = selectedRows[0].index_attributes;
            editingIndex.desc = selectedRows[0].index_desc;

            this.setState({
                editingIndex: editingIndex,
                isEditingKeyIndex: selectedRows[0].key
            })
        },
        renderCell: (checked, record, index, originNode) => {
            return (
                <Fragment>
                    {this.state.isShownButtonAlterIndexConfirm === "none" && (originNode)}
                </Fragment>
            )
        }
    }

    onInputIndexNameChanged(e) {

        let editingIndex = JSON.parse(JSON.stringify(this.state.editingIndex));
        editingIndex.name = e.target.value;
        this.setState({
            editingIndex: editingIndex
        })
    }

    onInputPartitionNameChanged(e) {

        let editingPartition = JSON.parse(JSON.stringify(this.state.editingPartition));
        editingPartition.name = e.target.value;
        this.setState({
            editingPartition: editingPartition
        })
    }

    getTableSql(table) {
        let strSql = "CREATE TABLE ";

        strSql += table.table_name + "(\n";

        table.columns.forEach((item) => {
            if (this.gMap.columns.has(item)) {
                let column = this.gMap.columns.get(item);
                let dataType = column.data_type === null ? "UNKNOWN" : column.data_type.toLowerCase();

                switch (dataType) {
                    case "varchar":
                    case "varchar2":
                    case "string":
                        strSql += "\t" + column.column_name + " VARCHAR(" + column.data_length + "),\n";
                        break
                    case "number":
                    case "int":
                    case "float":
                    case "double":
                        strSql += "\t" + column.column_name + " INT,\n";
                        break
                    case "date":
                    case "datetime":
                        strSql += "\t" + column.column_name + " DATETIME,\n";
                        break
                    default:
                        strSql += "\t" + column.column_name + " " + dataType + ",\n"
                        break
                }

            }
        });

        strSql += ");\n";

        return strSql;
    }

    getTableSqlHtml(table) {
        /*
                        //let tableSql = 'CREATE TABLE "' + table.table_name + '"(\n';
                //let domTableSql = [];

                //domTableSql.push(<Fragment>create table {table.table_name}(<br/></Fragment>);
                switch (item.data_type) {
                    case "varchar":
                    case "varchar2":
                        //tableSql += '\t"' + item.column_name + '" ' + item.data_type.toUpperCase() + '(' + item.data_length + '),\n';
                        //domTableSql.push(
                        //    <Fragment>{item.column_name} {item.data_type.toUpperCase()}(item.data_length),<br/></Fragment>);
                        break
                    default:
                        if (item.data_type !== null) {
                            //tableSql += '\t"' + item.column_name + '" ' + item.data_type.toUpperCase() + ',\n';
                            //domTableSql.push(<Fragment>{item.column_name} {item.data_type.toUpperCase()},<br/></Fragment>);
                        }
                        break
                }

                //tableSql = tableSql.substr(0, tableSql.length - 2);
                //tableSql += "\n);\n\n";
                //domTableSql.push(<Fragment>);<br/></Fragment>);


         */
    }

    onTabsTablePropertiesChanged(key) {
        switch (key) {
            case "tablePaneSql":
                if (this.gMap.tables.has(this.gCurrent.tableId)) {
                    let table = this.gMap.tables.get(this.gCurrent.tableId)
                    let strSql = this.getTableSql(table);

                    this.setState({
                        tableSql: strSql
                    });
                }
                break
            default:
                break
        }
    }

    // >>>>> on select 目标数据库链接 changed
    onSelectConnectionsChanged(value, option) {
        this.gCurrent.dbTarget.connectionId = value;
    }

    uiGetTablesByLetter(source, letter) {
        let myResult = [];

        if (letter === undefined) return myResult

        let tables;
        switch (source) {
            case "known":
                tables = this.gMap.tablesKnownByLetter;
                break
            case "unknown":
                tables = this.gMap.tablesUnknownByLetter;
                break
            case "archived":
                tables = this.gMap.tablesArchivedByLetter;
                break
            case "ignored":
                tables = this.gMap.tablesIgnoredByLetter;
                break
            default:
                break
        }

        if (!tables.has(letter)) return myResult;

        tables.get(letter).tables.forEach((value, key) => {
            let tableName = key;

            let nodeTable = {
                key: tableName,
                title: tableName,
                children: [],
                tag: {
                    nodeType: "table",
                    tableId: value.tableId,
                },
            }

            value.columns.forEach((item) => {
                let nodeColumn = {
                    key: tableName + this.gSpliterTableColumn + item.name,
                    title: item.name + " : " + item.type,
                    children: [],
                    tag: {
                        nodeType: "table_column",
                        dataType: item.type,
                        dataLength: item.length
                    },
                }
                nodeTable.children.push(nodeColumn);
            })
            myResult.push(nodeTable);
        });

        return myResult;
    }

    onSelectOnlineConnectionsChanged(value, option) {
        this.gCurrent.onlineConnectionId = value;
        let connection = this.gMap.connections.get(value);

        axios.post("http://" + this.context.serviceIp + ":" + this.context.servicePort + "/api/core/get_db_schemas", connection,
            {headers: {'Content-Type': 'application/json'}}).then((response) => {

            let mapTablesByLetter = new Map();
            let setLetters = new Set();
            let data = response.data.data[0].data;
            let dataIndex = response.data.data[1].data;
            let dataPartition = response.data.data[2].data;
            let lettersUnknown;
            console.log(dataIndex, dataPartition);

            for (let i = 0; i < data.rows.length; i++) {
                let item = data.rows[i];
                let tableName = item[0].toLowerCase();
                let columnName = item[1].toLowerCase();
                let dataType = item[2].toLowerCase();
                let dataLength = item[3];

                if (tableName.startsWith("temp_") || tableName.endsWith("$")) continue

                let firstLetter = tableName[0].toUpperCase();
                setLetters.add(firstLetter);
                if (!mapTablesByLetter.has(firstLetter)) {
                    let mapTables = new Map();
                    mapTables.set(tableName, {columns: [{name: columnName, type: dataType, length: dataLength}]});
                    mapTablesByLetter.set(firstLetter, {tables: mapTables});
                } else {
                    if (!mapTablesByLetter.get(firstLetter).tables.has(tableName)) {
                        mapTablesByLetter.get(firstLetter).tables.set(tableName, {
                            columns: [{
                                name: columnName,
                                type: dataType,
                                length: dataLength
                            }]
                        });
                    } else {
                        mapTablesByLetter.get(firstLetter).tables.get(tableName).columns.push({
                            name: columnName,
                            type: dataType,
                            length: dataLength
                        });
                    }
                }
            }
            this.gMap.tablesUnknownByLetter = mapTablesByLetter;

            // 生成UI数据
            lettersUnknown = Array.from(setLetters).sort();
            let lettersUnknownTreeData = [];
            lettersUnknown.forEach((item) => {
                lettersUnknownTreeData.push({
                    key: item,
                    title: item,
                    children: []
                })
            })

            let treeDataTablesUnknown = this.uiGetTablesByLetter("unknown", lettersUnknown[0]);
            this.gCurrent.letterUnknownSelected = lettersUnknown[0];


            if (connection.db_type === "oracle") {
                // index information
                let mapTableIndexes = new Map();
                for (let i = 0; i < dataIndex.rows.length; i++) {
                    let item = dataIndex.rows[i];
                    let tableName = item[0] ? item[0].toLowerCase() : item[0]; //0: {name: "TABLE_NAME"}
                    let indexName = item[1]; //1: {name: "INDEX_NAME"}
                    let indexType = item[2] ? item[2].toLowerCase() : item[2]; //2: {name: "INDEX_TYPE"}
                    let uniqueness = item[3] ? item[3].toLowerCase() : item[3]; //3: {name: "UNIQUENESS"}
                    let columnName = item[4] ? item[4].toLowerCase() : item[4]; //4: {name: "COLUMN_NAME"}
                    let columnPosition = item[5]; //5: {name: "COLUMN_POSITION"}
                    let descend = item[6] ? item[6].toLowerCase() : item[6]; //6: {name: "DESCEND"}
                    if (!mapTableIndexes.has(tableName)) {
                        let mapIndex = new Map();
                        mapIndex.set(indexName, {
                            indexType: indexType, uniqueness: uniqueness, columns: [{
                                indexName: indexName,
                                columnName: columnName,
                                columnPosition: columnPosition,
                                descend: descend
                            }]
                        });
                        mapTableIndexes.set(tableName, mapIndex);
                    } else {
                        if (!mapTableIndexes.get(tableName).has(indexName)) {
                            mapTableIndexes.get(tableName).set(indexName, {
                                indexType: indexType, uniqueness: uniqueness, columns: [{
                                    indexName: indexName,
                                    columnName: columnName,
                                    columnPosition: columnPosition,
                                    descend: descend
                                }]
                            })
                        } else {
                            mapTableIndexes.get(tableName).get(indexName).columns.push({
                                indexName: indexName,
                                columnName: columnName,
                                columnPosition: columnPosition,
                                descend: descend
                            })
                        }
                    }
                }
                this.gMap.tableIndexes = mapTableIndexes;
                console.log(mapTableIndexes);

                // partition information
                let mapTablePartitions = new Map();
                for (let i = 0; i < dataPartition.rows.length; i++) {
                    let item = dataPartition.rows[i];
                    let tableName = item[0] ? item[0].toLowerCase() : item[0]; //0: {name: "TABLE_NAME"}
                    let partitionType = item[1] ? item[1].toLowerCase() : item[1]; //1: {name: "PARTITION_TYPE"}
                    let partitionName = item[2]; //2: {name: "PARTITION_NAME"}
                    let highValue = item[3] ? item[3].toLowerCase() : item[3]; //3: {name: "HIGH_VALUE"}
                    let partitionPosition = item[4]; //4: {name: "PARTITION_POSITION"}
                    let columnName = item[5] ? item[5].toLowerCase() : item[5]; //5: {name: "COLUMN_NAME"}

                    if (!mapTablePartitions.has(tableName)) {
                        mapTablePartitions.set(tableName, {
                            partitionType: partitionType, columnName: columnName, partitions: [{
                                partitionName: partitionName, highValue: highValue, partitionPosition: partitionPosition
                            }]
                        });
                    } else {
                        mapTablePartitions.get(tableName).partitions.push({
                            partitionName: partitionName, highValue: highValue, partitionPosition: partitionPosition
                        })
                    }
                }
                this.gMap.tablePartitions = mapTablePartitions;
            } else if (connection.db_type === "mysql") {
                // 索引信息
                // 目前rest服务返回内容有问题，需要修正
                this.gMap.tableIndexes = new Map();
                // 分区信息
                // 目前rest服务返回内容有问题，需要修正
                this.gMap.tablePartitions = new Map();
            }

            this.setState({
                lettersUnknownSelectedKeys: [],
                lettersUnknownTreeData: [],
                treeDataTablesUnknown: [],
            }, () => {
                this.setState({
                    lettersUnknownSelectedKeys: [lettersUnknown[0]],
                    lettersUnknownTreeData: lettersUnknownTreeData,
                    treeDataTablesUnknown: treeDataTablesUnknown,
                });
            });
        });
    }

    onDataSourceChanged(e) {
        if (e.target.value === 1) {
            // this.setState({
            //     tabNavSelected: "tabNavOne"
            // })
        } else if (e.target.value === 2) {
            this.setState({
                tabNavSelected: "tabNavOne",
                isErDiagram: false,
            })
        }

        this.setState({
            radioDataSource: e.target.value,
            styleLayout: e.target.value === 1 ? "NNN" : "SNN"
        })
    }

    //todo >>>>> render
    render() {
        const optionsDataType = [
            {label: "请选择", value: -99999},
            {label: "字符串", value: "string"},
            {label: "整数", value: "int"},
            {label: "浮点数", value: "double"},
            {label: "日期", value: "datetime"},
        ];
        const optionsYesOrNo = [
            {label: "是", value: "yes"},
            {label: "否", value: "no"},
        ];

        const getDataType = (dataType) => {
            if (dataType.toUpperCase() === "VARCHAR") dataType = "STRING";
            let myResult = null;
            for (let i = 1; i < optionsDataType.length; i++) {
                if (optionsDataType[i].value.toUpperCase() === dataType.toUpperCase()) {
                    myResult = optionsDataType[i].label;
                    break
                }
            }

            return myResult
        }
        const getYesOrNo = (flag) => {
            let myResult = null;
            for (let i = 0; i < optionsYesOrNo.length; i++) {
                if (optionsYesOrNo[i].value === flag) {
                    myResult = optionsYesOrNo[i].label;
                    break
                }
            }

            return myResult
        }

        const columnsColumn = [
            {
                title: <KColumnTitle content='字段名称' className={'clsColumnTitle'}/>,
                dataIndex: 'column_name',
                key: 'column_name',
                className: 'clsColumnColumnName',
                width: 300,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.column_name} onChange={this.onInputColumnNameChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.column_name}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='数据类型' className={'clsColumnTitle'}/>,
                dataIndex: 'data_type',
                key: 'data_type',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 100,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="TableColumnDataTypeEditor">
                                <Select options={optionsDataType}
                                        defaultValue={record.data_type === null ? -99999 : record.data_type}
                                        onChange={this.onSelectColumnDataTypeChanged}/>
                            </div>
                        ) : (
                            <div className="TableColumnDataType">
                                {getDataType(record.data_type)}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='数据长度' className={'clsColumnTitle'}/>,
                dataIndex: 'data_length',
                key: 'data_length',
                align: 'right',
                className: 'clsColumnColumnName',
                width: 100,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.data_length}
                                       onChange={this.onInputColumnDataLengthChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.data_length}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='主键' className={'clsColumnTitle'}/>,
                dataIndex: 'primary_flag',
                key: 'primary_flag',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 60,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Checkbox
                                    defaultChecked={(record.primary_flag === null) ? false : (record.primary_flag === "yes")}
                                    onChange={this.onCheckboxColumnPrimaryFlagChanged}>是</Checkbox>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {getYesOrNo(record.primary_flag)}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='可空' className={'clsColumnTitle'}/>,
                dataIndex: 'nullable_flag',
                key: 'nullable_flag',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 60,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Checkbox
                                    defaultChecked={(record.nullable_flag === null) ? false : (record.nullable_flag === "yes")}
                                    onChange={this.onCheckboxColumnNullableFlagChanged}>是</Checkbox>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {getYesOrNo(record.nullable_flag)}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='缺省值' className={'clsColumnTitle'}/>,
                dataIndex: 'data_default',
                key: 'data_default',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 200,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.data_default}
                                       onChange={this.onInputColumnDataDefaultChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.data_default}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='分隔符' className={'clsColumnTitle'}/>,
                dataIndex: 'split_flag',
                key: 'split_flag',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 100,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.split_flag} onChange={this.onInputColumnSplitFlagChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.split_flag}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='重复标识' chong className={'clsColumnTitle'}/>,
                dataIndex: 'repeat_flag',
                key: 'repeat_flag',
                align: 'center',
                className: 'clsColumnColumnName',
                width: 100,
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.repeat_flag}
                                       onChange={this.onInputColumnRepeatFlagChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.repeat_flag}
                            </div>
                        )
                    )
                }
            },
            {
                title: <KColumnTitle content='字段简述' className={'clsColumnTitle'}/>,
                dataIndex: 'column_desc',
                key: 'column_desc',
                className: 'clsColumnColumnName',
                render: (text, record) => {
                    return (
                        (this.state.tableColumnEditingKey === record.key) ? (
                            <div className="clsProjectKpiUiTitleEditor">
                                <Input defaultValue={record.column_desc} onChange={this.onInputColumnDescChanged}/>
                            </div>
                        ) : (
                            <div className="clsProjectKpiUiTitle">
                                {record.column_desc}
                            </div>
                        )
                    )
                }
            },
        ];
        const columnsIndex = [
            {
                title: <KColumnTitle content='索引名称' className={'clsColumnTitle'}/>,
                dataIndex: 'index_name',
                key: 'index_name',
                width: 300,
                render: (text, record) => {
                    return (
                        <Fragment>
                            {this.state.isEditingKeyIndex !== record.key && (
                                <span>
                                {text}
                                </span>
                            )}
                            {this.state.isEditingKeyIndex === record.key && (
                                <span style={{display: this.state.isShownButtonAddIndex}}>
                                {text}
                                </span>
                            )}
                            {this.state.isEditingKeyIndex === record.key && (
                                <Input
                                    style={{display: this.state.isShownButtonAlterIndexConfirm}}
                                    value={this.state.editingIndex.name}
                                    onChange={this.onInputIndexNameChanged}
                                />
                            )}
                        </Fragment>


                    )
                }
            },
            {
                title: <KColumnTitle content='索引类型' className={'clsColumnTitle'}/>,
                dataIndex: 'index_type',
                key: 'index_type',
                width: 100,
            },
            {
                title: <KColumnTitle content='索引字段' className={'clsColumnTitle'}/>,
                dataIndex: 'index_columns',
                key: 'index_columns',
                render: (text, record) => {
                    return (
                        <Fragment>
                            {this.state.isEditingKeyIndex !== record.key && (
                                <div className={"clsIndexColumns"}>
                                    {record.columns.map((item) => {
                                        return <div className={"clsIndexColumn"}>
                                            <div>{item.columnName}</div>
                                            <div>({item.descend})</div>
                                        </div>
                                    })}
                                </div>
                            )}
                            {this.state.isEditingKeyIndex === record.key && (
                                <div className={"clsIndexColumns"} style={{display: this.state.isShownButtonAddIndex}}>
                                    {record.columns.map((item) => {
                                        return <div className={"clsIndexColumn"}>
                                            <div>{item.columnName}</div>
                                            <div>({item.descend})</div>
                                        </div>
                                    })}
                                </div>
                            )}
                            {this.state.isEditingKeyIndex === record.key && (
                                <Input
                                    style={{display: this.state.isShownButtonAlterIndexConfirm}}
                                    value={this.state.editingIndex.name}
                                    onChange={this.onInputIndexNameChanged}
                                />
                            )}
                        </Fragment>
                    )
                }
            },
        ];
        const columnsPartition = [
            {
                title: <KColumnTitle content='分区类型' className={'clsColumnTitle'}/>,
                dataIndex: 'partition_type',
                key: 'partition_type',
                width: 100,
                align: 'center',
            },
            {
                title: <KColumnTitle content='分区字段' className={'clsColumnTitle'}/>,
                dataIndex: 'partition_column',
                key: 'partition_column',
                width: 200,
                align: 'center',
            },
            {
                title: <KColumnTitle content='分区名称' className={'clsColumnTitle'}/>,
                dataIndex: 'partitionNames',
                key: 'partitionNames',
                width: 200,
                render: (text, record) => {
                    return (
                        <Fragment>
                            {this.state.isEditingKeyPartition !== record.key && (
                                <div className={"clsPartitionNames"}>
                                    {record.partitionNames.map((item) => {
                                        return <div className={"clsPartitionName"}>
                                            <div>{item}</div>
                                        </div>
                                    })}
                                </div>
                            )}
                            {this.state.isEditingKeyPartition === record.key && (
                                <div className={"clsPartitionNames"}
                                     style={{display: this.state.isShownButtonAddPartition}}>
                                    {record.partitionNames.map((item) => {
                                        return <div className={"clsPartitionName"}>
                                            <div>{item}</div>
                                        </div>
                                    })}
                                </div>

                            )}
                            {this.state.isEditingKeyPartition === record.key && (
                                <Input
                                    style={{display: this.state.isShownButtonAlterPartitionConfirm}}
                                    value={this.state.editingPartition.name}
                                    onChange={this.onInputPartitionNameChanged}
                                />
                            )}
                        </Fragment>
                    )
                }
            },
            {
                title: <KColumnTitle content='分区表达式' className={'clsColumnTitle'}/>,
                dataIndex: 'partitionHighValues',
                key: 'partitionHighValues',
                width: 800,
                render: (text, record) => {
                    return (
                        <Fragment>
                            {this.state.isEditingKeyPartition !== record.key && (
                                <div className={"clsPartitionHighValues"}>
                                    {record.partitionHighValues.map((item) => {
                                        return <div className={"clsPartitionHighValue"}>
                                            <div>{item}</div>
                                        </div>
                                    })}
                                </div>
                            )}
                            {this.state.isEditingKeyPartition === record.key && (
                                <div className={"clsPartitionHighValues"}
                                     style={{display: this.state.isShownButtonAddPartition}}>
                                    {record.partitionHighValues.map((item) => {
                                        return <div className={"clsPartitionHighValue"}>
                                            <div>{item}</div>
                                        </div>
                                    })}
                                </div>

                            )}
                            {this.state.isEditingKeyPartition === record.key && (
                                <Input
                                    style={{display: this.state.isShownButtonAlterPartitionConfirm}}
                                    value={this.state.editingPartition.name}
                                    onChange={this.onInputPartitionNameChanged}
                                />
                            )}
                        </Fragment>
                    )
                }
            },
            {
                title: <KColumnTitle content='分区简述' className={'clsColumnTitle'}/>,
                dataIndex: 'partition_desc',
                key: 'partition_desc',
                width: 200,
            },
        ];
        const columnsRelation = [
            {
                title: '关系类型', //
                dataIndex: 'relation_type',
                key: 'relation_type',
            },
            {
                title: '源表字段',
                dataIndex: 's_column_id',
                key: 's_column_id',
            },
            {
                title: '数据流向', //
                dataIndex: 'data_flow',
                key: 'data_flow',
            },
            {
                title: '关联表',
                dataIndex: 'a_table_id',
                key: 'a_table_id',
            },
            {
                title: '关联表字段',
                dataIndex: 'a_column_id',
                key: 'a_column_id',
            },
            {
                title: '关系简述',
                dataIndex: 'relation_desc',
                key: 'relation_desc',
            },
        ];

        return (
            <div
                className={this.state.styleLayout === "NNN" ? "DatabaseWorkspace" : this.state.styleLayout === "SNN" ? "DatabaseWorkspace BoxSmall" : this.state.styleLayout === "SSN" ? "DatabaseWorkspace BoxSmallSmall" : "DatabaseMaintain"}>
                <div className={"BoxProductsInfo"}>
                    <div className={"BoxTitleBar"}>
                        <div className={this.state.styleLayout === "NNN" ? "BoxTitle" : "BoxTitle BoxHidden"}>产品信息：
                        </div>
                        <Button onClick={this.onButtonProductsChangeComponentSizeClicked}
                                icon={this.state.styleLayout === "NNN" ? <CaretLeftOutlined/> : <CaretRightOutlined/>}
                                size={"small"} type={"ghost"}/>
                    </div>
                    <div className={this.state.styleLayout === "NNN" ? "BoxTree" : "BoxTree BoxHidden"}>
                        <Tree ref={this.gRef.treeProducts}
                              treeData={this.state.treeDataProducts}
                              onSelect={this.onTreeProductsSelected}
                              onExpand={this.onTreeProductsExpanded}
                              selectedKeys={this.state.treeSelectedKeysProducts}
                              expandedKeys={this.state.treeExpandedKeysProducts}
                              switcherIcon={<CaretDownOutlined/>} blockNode={true} showLine={{showLeafIcon: false}}
                              showIcon={true}/>
                    </div>
                </div>
                <div className={"BoxKnown"}>
                    <div className={"BoxTitleBar"}>
                        <div
                            className={(this.state.styleLayout === "NNN") || (this.state.styleLayout === "SNN") ? "BoxTitle" : "BoxTitle BoxHidden"}>
                            <Radio.Group onChange={this.onDataSourceChanged} value={this.state.radioDataSource}>
                                <Radio value={1}>产品库表：</Radio>
                                <Radio value={2}>在线库表：</Radio>
                            </Radio.Group>
                        </div>
                        <Button onClick={this.onButtonTablesChangeComponentSizeClicked}
                                icon={(this.state.styleLayout === "NNN") || (this.state.styleLayout === "SNN") ?
                                    <CaretLeftOutlined/> : <CaretRightOutlined/>} size={"small"} type={"ghost"}/>
                    </div>
                    <div
                        className={(this.state.styleLayout === "NNN") || (this.state.styleLayout === "SNN") ? "BoxSelect" : "BoxSelect BoxHidden"}>
                        <Select className={this.state.radioDataSource === 2 ? "BoxHidden" : ""} ref={this.gRef.selectDbUser}
                                onChange={this.onSelectDbUsersChanged}
                                defaultValue={this.state.dbUserSelected}
                                value={this.state.productLineDbUserId}
                                options={this.state.dbUsersSelectOptions}/>
                        <Select data-tag="在线数据源列表"
                                className={this.state.radioDataSource === 1 ? "BoxHidden" : ""}
                                onChange={this.onSelectOnlineConnectionsChanged}
                                defaultValue={this.state.connectionsSelected}
                                options={this.state.connectionsSelectOptions}
                                size="small"/>
                    </div>
                    <div
                        className={(this.state.styleLayout === "NNN") || (this.state.styleLayout === "SNN") ? "BoxTabs" : "BoxTabs BoxHidden"}>
                        <div className="Tabs">
                            <div className="TabPanes">
                                <div
                                    className={this.state.tabNavSelected === "tabNavOne" ? "TabPane" : "TabPane BoxHidden"}>
                                    <div className={this.state.radioDataSource === 2 ? "BoxHidden" : "BoxToolbar"}>
                                        <div className={"BoxSearch"}>
                                            <Input.Search placeholder="Search" size="small" enterButton
                                                          onChange={this.onInputSearchSchemasChanged}
                                                          onSearch={this.onInputSearchSchemasSearched}/>
                                        </div>
                                        <Button onClick={this.onButtonAddTableClicked} icon={<PlusSquareOutlined/>}
                                                size={"small"} type={"primary"}>新增</Button>
                                        <Button onClick={this.onButtonCloneTableClicked} icon={<PlusSquareOutlined/>}
                                                size={"small"} type={"primary"}>复制</Button>
                                        <Button onClick={this.onButtonRenameTableClicked}
                                                disabled={this.state.isTableNameEditing} size={"small"} type={"primary"}
                                                icon={<PlusSquareOutlined/>}>修改</Button>
                                        {/*<Button size={"small"} type={"primary"} icon={<PlusSquareOutlined/>} onClick={this.onButtonDbUserEditConfirmClicked}>确认</Button>*/}
                                        {/*<Button size={"small"} type={"primary"} icon={<PlusSquareOutlined/>} onClick={this.onButtonDbUserEditCancelClicked}>放弃</Button>*/}
                                        <Button size={"small"} type={"primary"} icon={<PlusSquareOutlined/>}>删除</Button>
                                        {/*<Checkbox>分组显示</Checkbox>*/}
                                    </div>
                                    <div className={this.state.radioDataSource === 2 ? "BoxHidden" : "BoxListTree"}>
                                        <div className={"BoxList"}>
                                            <Tree ref={this.gRef.treeTableFirstLetters}
                                                  treeData={this.state.treeDataLettersKnown}
                                                  onSelect={this.onTreeLettersKnownSelected}
                                                  defaultSelectedKeys={this.state.lettersKnownSelectedKeys}
                                                  selectedKeys={this.state.treeSelectedKeysTableFirstLetters}
                                                  className={"TreeLetters"} blockNode={true}
                                                  showLine={{showLeafIcon: false}} showIcon={false}/>
                                        </div>
                                        <div className={"BoxTree"}>
                                            <div className={"BoxTree2"}>
                                                <Tree ref={this.gRef.treeTables}
                                                      treeData={this.state.treeDataTablesKnown}
                                                      onSelect={this.onTreeTablesKnownSelected}
                                                      selectedKeys={this.state.treeSelectedKeysTables}
                                                      selectable={!this.state.isTableNameEditing}
                                                      className={"TreeKnown"} switcherIcon={<CaretDownOutlined/>}
                                                      blockNode={true} showLine={true} showIcon={true}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={this.state.radioDataSource === 1 ? "BoxHidden" : "BoxToolbar"}>
                                        <div className={"BoxSearch"}>
                                            <Input.Search placeholder="Search" size="small" enterButton
                                                          onChange={this.onInputSearchSchemasChanged}
                                                          onSearch={this.onInputSearchSchemasSearched}/>
                                        </div>
                                    </div>
                                    <div className={this.state.radioDataSource === 1 ? "BoxHidden" : "BoxListTree"}>
                                        <div className={"BoxList"}>
                                            <Tree ref={this.gRef.treeTableFirstLetters}
                                                  treeData={this.state.lettersUnknownTreeData}
                                                  //onSelect={this.onTreeLettersKnownSelected}
                                                  //defaultSelectedKeys={this.state.lettersKnownSelectedKeys}
                                                  //selectedKeys={this.state.treeSelectedKeysTableFirstLetters}
                                                  className={"TreeLetters"} blockNode={true}
                                                  showLine={{showLeafIcon: false}} showIcon={false}/>
                                        </div>
                                        <div className={"BoxTree"}>
                                            <div className={"BoxTree2"}>
                                                <Tree data-tag="在线库表树"
                                                      ref={this.gRef.treeTables}
                                                      treeData={this.state.treeDataTablesUnknown}
                                                      onSelect={this.onTreeTablesOnlineSelected}
                                                      //selectedKeys={this.state.treeSelectedKeysTables}
                                                      //selectable={!this.state.isTableNameEditing}
                                                      className={"TreeKnown"} switcherIcon={<CaretDownOutlined/>}
                                                      blockNode={true} showLine={true} showIcon={true}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={this.state.tabNavSelected === "tabNavTwo" ? "TabPane" : "TabPane BoxHidden"}>
                                    <div className="BoxToolbar">
                                        <div className={"BoxSearch"}>
                                            <Input.Search placeholder="Search" size="small" enterButton
                                                          onChange={this.onInputSearchSchemasChanged}
                                                          onSearch={this.onInputSearchSchemasSearched}/>
                                        </div>
                                        <Button onClick={this.onButtonAddTable2ErDiagramClicked}
                                                icon={<PlusSquareOutlined/>} size={"small"}
                                                type={"primary"}>加入ER图</Button>
                                    </div>
                                    <div className={"BoxUpDown"}>
                                        <div className="BoxLeftRight">
                                            <div className={"BoxList"}>
                                                <Tree ref={this.gRef.treeTableFirstLetters4ErDiagram}
                                                      treeData={this.state.treeDataLettersKnown}
                                                      onSelect={this.onTreeLettersKnownSelected}
                                                      selectedKeys={this.state.treeSelectedKeysTableFirstLetters}
                                                      defaultSelectedKeys={this.state.lettersKnownSelectedKeys}
                                                      className={"TreeLetters"} blockNode={true}
                                                      showLine={{showLeafIcon: false}} showIcon={false}/>
                                            </div>
                                            <div className={"BoxTree"}>
                                                <div className={"BoxTreeInstance"}>
                                                    <Tree ref={this.gRef.treeTables4ErDiagram}
                                                          treeData={this.state.treeDataTablesKnown}
                                                          onSelect={this.onTreeTablesKnownSelected}
                                                          selectedKeys={this.state.treeSelectedKeysTables}
                                                          selectable={!this.state.isTableNameEditing}
                                                          className={"TreeKnown"} switcherIcon={<CaretDownOutlined/>}
                                                          blockNode={true} showLine={true} showIcon={true}/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="BoxToolbarErDiagram">
                                            <div className={"BoxSearch"}>
                                                <Input.Search placeholder="Search" size="small" enterButton
                                                              onChange={this.onInputSearchSchemasChanged}
                                                              onSearch={this.onInputSearchSchemasSearched}/>
                                            </div>
                                            <Button onClick={this.onButtonAddTableErDirClicked}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>新建目录</Button>
                                            <Button onClick={this.onButtonAddTableErClicked}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>新建ER图</Button>
                                            <Button disabled={this.state.isTableNameEditing} size={"small"}
                                                    type={"primary"} icon={<PlusSquareOutlined/>}>修改</Button>
                                            {/*<Button size={"small"} type={"primary"} icon={<PlusSquareOutlined/>} onClick={this.onButtonDbUserEditConfirmClicked}>确认</Button>*/}
                                            {/*<Button size={"small"} type={"primary"} icon={<PlusSquareOutlined/>} onClick={this.onButtonDbUserEditCancelClicked}>放弃</Button>*/}
                                            <Button size={"small"} type={"primary"}
                                                    icon={<PlusSquareOutlined/>}>删除</Button>
                                        </div>
                                        <div className={"BoxTreeErDiagram"}>
                                            <div className={"BoxTree"}>
                                                <div className={"BoxTreeInstance"}>
                                                    <Tree ref={this.gRef.treeErDiagrams}
                                                          treeData={this.state.treeDataTableErs}
                                                          onSelect={this.onTreeErDiagramSelected}
                                                          selectable={!this.state.isTableNameEditing}
                                                          className={"TreeKnown"} switcherIcon={<CaretDownOutlined/>}
                                                          blockNode={true} showLine={true} showIcon={true}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="TabNavs">
                                <Button id="tabNavOne"
                                        className={this.state.tabNavSelected === "tabNavOne" ? "TabNavSelected" : "TabNavNormal"}
                                        onClick={this.onButtonListTreeClicked}>树图</Button>
                                <Button id="tabNavTwo"
                                        className={this.state.tabNavSelected === "tabNavTwo" ? "TabNavSelected" : "TabNavNormal"}
                                        onClick={this.onButtonErDiagramClicked}>ER图</Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={this.state.isErDiagram ? "BoxErDiagram" : "BoxHidden"}>
                    <div className="BoxTitleBar">
                        <div className="BoxTitle">产品信息：</div>
                        <Button icon={(this.state.styleLayout === "NNN") || (this.state.styleLayout === "SNN") ?
                            <CaretLeftOutlined/> : <CaretRightOutlined/>} size={"small"} type={"ghost"}/>
                    </div>
                    <div className="BoxContent">
                        <div ref={this.gRef.x6StencilContainerBox} className="BoxEntities"/>
                        <div className={"box-box-canvas"}>
                            <div className={"box-box-canvas-toolbar"}>
                                <div className={"box-box-canvas-toolbar-title"}>&nbsp;</div>
                                <div className={"box-box-canvas-toolbar-buttons"}>
                                    <Button size={"small"} type={"primary"} onClick={this.onButtonX6Save}>保存</Button>
                                    <Button size={"small"} type={"primary"} onClick={this.onButtonX6ToPng}>导出</Button>
                                </div>
                            </div>
                            <div ref={this.gRef.x6GraphContainerBox} className="box-canvas">
                                <div ref={this.gRef.x6GraphContainer}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={!this.state.isErDiagram ? "BoxPropertiesBorder" : "BoxHidden"}>
                    <div className={"BoxProperties"}>
                        <div className={"BoxTableProperties"}>
                            <Input placeholder="请输该表用途的简单描述"/>
                            <Select/>
                            <Select/>
                        </div>
                        <div className={"BoxOtherProperties"}>
                            <Tabs defaultActiveKey="tablePaneColumns" type="card" tabBarGutter={5} animated={false}
                                  onChange={this.onTabsTablePropertiesChanged}>
                                <TabPane tab="表字段" key="tablePaneColumns">
                                    <div className={"BoxTableColumnProperties"}>
                                        <div className={"BoxToolbar"}>
                                            <div className={"BoxLabel"}>&nbsp;</div>
                                            <Button onClick={this.onButtonAddColumnClicked}
                                                    disabled={this.state.isColumnEditing} icon={<PlusSquareOutlined/>}
                                                    size={"small"} type={"primary"}>新增</Button>
                                            <Button onClick={this.onButtonAlterColumnClicked}
                                                    disabled={this.state.isColumnEditing} icon={<PlusSquareOutlined/>}
                                                    size={"small"} type={"primary"}>修改</Button>
                                            <Button onClick={this.onButtonAlterColumnConfirmClicked}
                                                    disabled={!this.state.isColumnEditing} icon={<PlusSquareOutlined/>}
                                                    size={"small"} type={"primary"}>确认</Button>
                                            <Button onClick={this.onButtonAlterColumnCancelClicked}
                                                    disabled={!this.state.isColumnEditing} icon={<PlusSquareOutlined/>}
                                                    size={"small"} type={"primary"}>放弃</Button>
                                            <Button onClick={this.onButtonDeleteColumnClicked}
                                                    disabled={this.state.isColumnEditing} icon={<PlusSquareOutlined/>}
                                                    size={"small"} type={"primary"}>删除</Button>
                                        </div>
                                        <div ref={this.gRef.boxTableColumns} className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.dsColumns}
                                                columns={columnsColumn}
                                                scroll={{
                                                    x: this.state.tablePropertiesScrollX,
                                                    y: this.state.tablePropertiesScrollY
                                                }}
                                                bordered={true}
                                                size={"small"}
                                                pagination={{
                                                    pageSize: this.state.pageSizeColumns,
                                                    position: ["none", "none"]
                                                }}
                                                rowSelection={(this.state.tableColumnEditingKey === null) && {type: "radio", ...this.onRowColumnSelected}}
                                                // rowSelection={{
                                                //     type: "radio",
                                                //     ...this.onRowColumnSelected
                                                // }}
                                            />
                                        </div>
                                    </div>
                                </TabPane>
                                <TabPane tab="表索引" key="tablePaneIndexes">
                                    <div className={"BoxTableIndexProperties"}>
                                        <div className={"BoxToolbar"}>
                                            <div className={"BoxLabel"}>&nbsp;</div>
                                            <Button onClick={this.onButtonAddIndexClicked}
                                                    style={{display: this.state.isShownButtonAddIndex}}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>新增</Button>
                                            <Button onClick={this.onButtonAlterIndexClicked}
                                                    disabled={this.state.isShownButtonAlterIndexConfirm === "block"}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>修改</Button>
                                            <Button onClick={this.onButtonDeleteIndexClicked}
                                                    style={{display: this.state.isShownButtonDeleteIndex}}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>删除</Button>
                                            <Button onClick={this.onButtonAlterIndexConfirmClicked}
                                                    style={{display: this.state.isShownButtonAlterIndexConfirm}}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>确认</Button>
                                            <Button onClick={this.onButtonAlterIndexCancelClicked}
                                                    style={{display: this.state.isShownButtonAlterIndexCancel}}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>放弃</Button>
                                        </div>
                                        <div className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.dsIndexes}
                                                columns={columnsIndex}
                                                scroll={{y: this.state.tablePropertiesScrollY}}
                                                bordered={true}
                                                size={"small"}
                                                pagination={{
                                                    pageSize: this.state.pageSizeIndexes,
                                                    position: ["none", "none"]
                                                }}
                                                rowSelection={{
                                                    type: "radio",
                                                    ...this.onRowIndexSelected
                                                }}/>
                                        </div>
                                    </div>
                                </TabPane>
                                <TabPane tab="表分区" key="tablePanePartitions">
                                    <div className={"BoxTablePartitionProperties"}>
                                        <div className={"BoxToolbar"}>
                                            <div className={"BoxLabel"}>&nbsp;</div>
                                            <Button
                                                onClick={this.onButtonAddPartitionClicked}
                                                style={{display: this.state.isShownButtonAddPartition}}>新增</Button>
                                            <Button
                                                onClick={this.onButtonAlterPartitionClicked}
                                                disabled={this.state.isShownButtonAlterPartitionConfirm === "block"}>修改</Button>
                                            <Button
                                                onClick={this.onButtonDeletePartitionClicked}
                                                style={{display: this.state.isShownButtonDeletePartition}}>删除</Button>
                                            <Button
                                                onClick={this.onButtonAlterPartitionConfirmClicked}
                                                style={{display: this.state.isShownButtonAlterPartitionConfirm}}>确认</Button>
                                            <Button
                                                onClick={this.onButtonAlterPartitionCancelClicked}
                                                style={{display: this.state.isShownButtonAlterPartitionCancel}}>放弃</Button>
                                        </div>
                                        <div className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.dsPartitions}
                                                columns={columnsPartition}
                                                scroll={{x: 1920, y: this.state.tablePropertiesScrollY}}
                                                bordered={true}
                                                size={"small"}
                                                pagination={{
                                                    pageSize: this.state.pageSizePartitions,
                                                    position: ["none", "none"]
                                                }}
                                                rowSelection={{
                                                    type: "radio",
                                                    ...this.onRowPartitionSelected
                                                }}/>
                                        </div>
                                    </div>
                                </TabPane>
                                <TabPane tab="表关联" key="tablePaneRelations">
                                    <div className={"BoxTableRelationProperties"}>
                                        <div className={"BoxToolbar"}>
                                            <div className={"BoxLabel"}>&nbsp;</div>
                                            <Button onClick={this.onButtonAddRelationClicked}
                                                    style={{display: this.state.isShownButtonAddRelation}}>新增</Button>
                                            <Button
                                                onClick={this.onButtonAlterRelationClicked}
                                                disabled={this.state.isShownButtonAlterRelationConfirm === "block"}>修改</Button>
                                            <Button onClick={this.onButtonDeleteRelationClicked}
                                                    style={{display: this.state.isShownButtonDeleteRelation}}>删除</Button>
                                            <Button onClick={this.onButtonAlterRelationConfirmClicked}
                                                    style={{display: this.state.isShownButtonAlterRelationConfirm}}>确认</Button>
                                            <Button onClick={this.onButtonAlterRelationCancelClicked}
                                                    style={{display: this.state.isShownButtonAlterRelationCancel}}>放弃</Button>
                                        </div>
                                        <div className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.dsRelations}
                                                columns={columnsRelation}
                                                scroll={{y: 400}}
                                                bordered={true}
                                                size={"small"}
                                                pagination={{
                                                    pageSize: this.state.pageSizeRelations,
                                                    position: ["none", "none"]
                                                }}
                                                rowSelection={{
                                                    type: "radio",
                                                    ...this.onRowRelationSelected
                                                }}/>
                                        </div>
                                    </div>
                                </TabPane>
                                <TabPane tab="表数据" key="tablePaneData">
                                    <div className={"BoxTableRelationProperties"}>
                                        <div className={"BoxToolbar"}>
                                            <div className={"BoxLabel"}>&nbsp;</div>
                                            <Button onClick={this.onButtonAddIndexClicked}
                                                    style={{display: this.state.isShownButtonAddRecord}}>新增</Button>
                                            <Button
                                                onClick={this.onButtonAlterIndexClicked}
                                                disabled={this.state.isShownButtonAlterRecordConfirm === "block"}>修改</Button>
                                            <Button onClick={this.onButtonDeleteIndexClicked}
                                                    style={{display: this.state.isShownButtonDeleteRecord}}>删除</Button>
                                            <Button onClick={this.onButtonAlterIndexConfirmClicked}
                                                    style={{display: this.state.isShownButtonAlterRecordConfirm}}>确认</Button>
                                            <Button onClick={this.onButtonAlterIndexCancelClicked}
                                                    style={{display: this.state.isShownButtonAlterRecordCancel}}>放弃</Button>
                                        </div>
                                        <div className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.dsRecords}
                                                columns={this.state.columnsRecord}
                                                scroll={{y: 400}}
                                                bordered={true}
                                                size={"small"}
                                                pagination={{
                                                    pageSize: this.state.pageSizeRecords,
                                                    position: ["none", "none"]
                                                }}
                                                rowSelection={{
                                                    type: "radio",
                                                    ...this.onRowRecordSelected
                                                }}/>
                                        </div>
                                        <div className={"BoxSelect"}>
                                            <Select onChange={this.onSelectConnectionsChanged}
                                                    defaultValue={this.state.connectionsSelected}
                                                    options={this.state.connectionsSelectOptions} size="small"/>
                                            <Button onClick={this.onButtonGetTableDataClicked}
                                                    icon={<PlusSquareOutlined/>} size={"small"}
                                                    type={"primary"}>获取数据</Button>
                                        </div>
                                        <div className={"BoxDetail"}>
                                            <Table
                                                dataSource={this.state.recordsDynamic}
                                                columns={this.state.columnsDynamic}
                                                // scroll={{y: 200}}
                                                bordered={true}
                                                size={"small"}
                                                // pagination={{
                                                //     pageSize: this.state.pageSizeRecords,
                                                //     position: ["none", "none"]
                                                // }}
                                                // rowSelection={{
                                                //     type: "radio",
                                                //     ...this.onRowRecordSelected
                                                // }}
                                            />
                                        </div>
                                    </div>
                                </TabPane>
                                <TabPane tab="表SQL" key="tablePaneSql">
                                    <div className={"BoxTableSqlProperties"}>
                                        <div className={"BoxDetail"}>
                                            <pre>{this.state.tableSql}</pre>
                                            {/*<div>*/}
                                            {/*    {this.state.domTableSql.map((item, index) => {*/}
                                            {/*        return item*/}
                                            {/*    })}*/}
                                            {/*</div>*/}
                                        </div>
                                    </div>
                                </TabPane>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
