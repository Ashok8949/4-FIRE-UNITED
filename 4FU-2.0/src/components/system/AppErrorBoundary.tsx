import {Component,type ErrorInfo,type ReactNode} from "react";
type Props={children:ReactNode};type State={failed:boolean};
export class AppErrorBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError(){return {failed:true}};
 componentDidCatch(error:Error,info:ErrorInfo){console.error("[4FU 2.0] runtime error",error,info)}
 render(){if(!this.state.failed)return this.props.children;return <div className="runtime-error"><span className="kicker">4FU SYSTEM RECOVERY</span><h1>INTERFACE INTERRUPTED.</h1><p>The app hit an unexpected UI error. Your existing Firebase and legacy systems remain untouched.</p><button onClick={()=>window.location.reload()}>RELOAD SYSTEM</button></div>}
}