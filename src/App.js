import 'antd/dist/antd.css'
import './App.scss'
import React from 'react'
import GCtx from "./GCtx";
import Header from "./components/Header";
import Content from "./components/Content";
import Footer from "./components/Footer";

class App extends React.Component{
  static contextType = GCtx;

  constructor(props) {
    super(props);
    this.state = {
      changeData: () => {
        this.setState({});
      },
      sender: {id: '', x: 0, y: 0, w: 0, h: 0},
      isShownSubMenu: false,
      subMenus: [],
      event: {target: undefined, x: 0, y: 0, w: 0, h: 0},
      changeSubMenus: (event, items) => {
        console.log(event);

        let e = {
          target: event.target,
          x: event.clientX,
          y: event.clientY,
          w: 0,
          h: 0
        };
        let menus = JSON.parse(JSON.stringify(items));
        let isShown = !this.state.isShownSubMenu;
        this.setState({isShownSubMenu: isShown, subMenus: menus, event: e});
      },
      contentChildren: [<Footer/>, <Footer/>],
      changeContentChildren: () => {
      },
      jsxSubMenu: []
    }

    this.onRefContent = this.onRefContent.bind(this);
    this.onMenuClicked = this.onMenuClicked.bind(this);
    this.onSubMenuClicked = this.onSubMenuClicked.bind(this);
  }

  componentDidMount() {
    this.setState({
      subMenus: this.context.subMenus
    });
    this.context.onMenuClicked = this.onMenuClicked;
  }

  componentDidUpdate() {
    //!!!do not set state again.
  }

  onRefContent(ref) {
    this.ComContent = ref;
  }

  onMenuClicked(sender) {
    let s = {
      id: sender.id,
      x: Math.ceil(sender.x),
      y: Math.ceil(sender.y) + 2,
      w: Math.ceil(sender.w),
      h: Math.ceil(sender.h)
    }

    let isShown = !this.state.isShownSubMenu;
    let jsxSubMenu = [];

    let subMenus = [];
    let children = this.context.mapMenus.get(s.id).children;

    for(let [key, value] of children){
      subMenus.push({id: key, label: value.label, desc: value.desc});
    }

    for (let item of subMenus) {
      jsxSubMenu.push(
        <div key={item.id}
             className={"SubMenu"}
             onClick={(e) => {
               this.onSubMenuClicked(e, item.id)
             }}>{item.label}</div>);
    }

    this.setState({
      jsxSubMenu: jsxSubMenu,
      sender: s,
      isShownSubMenu: isShown
    });
  }

  onSubMenuClicked(e, s) {
    switch(s) {
      case 'menu_lowcode_single_table':
        this.ComContent.showComponentLowcodeSingleTable();
        break
      case 'menu_database_struct':
        this.ComContent.showComponentDatabaseStruct();
        break
      case 'menu_database_relation':
        this.ComContent.showComponentDatabaseRelation();
        break
      case 'menu_database_import':
        this.ComContent.showComponentDatabaseImport();
        break
      case 'menu_database_export':
        this.ComContent.showComponentDatabaseExport();
        break
      default:
        break
    }

    this.setState({isShownSubMenu: !this.state.isShownSubMenu});
  }

  render() {
    return (
      <GCtx.Provider value={this.context}>
        <div className="App">
          <Header/>
          <Content onRef={(ref) => this.onRefContent(ref)}/>
          <Footer/>
          <div id="boxSubMenu"
               className={this.state.isShownSubMenu ? "BoxSubMenu Show" : "BoxSubMenu Hide"}
               style={{left: this.state.sender.x, top: this.state.sender.y}}>
            {this.state.jsxSubMenu.map((item) => {
              return item
            })}
          </div>
        </div>
      </GCtx.Provider>
    );
  }
}

export default App;
