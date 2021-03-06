﻿module BABYLON.EDITOR {
    interface INodeData extends Cy.NodeDataDefinition {
        name: string;
        type: string;
        actionsBuilderData: Object;
    }

    interface IEdgeData extends Cy.EdgeDataDefinition {
        name: string;
    }

    export class ActionsBuilderGraph {
        // Public members
        public canvasElement: JQuery = null;
        public onMouseUp: () => void = () => { };

        // Private members
        private _core: EditorCore;
        private _graph: Cy.Instance;
        
        private _mousex: number = 0;
        private _mousey: number = 0;

        /**
        * Constructor
        * @param mainToolbar: the main toolbar instance
        */
        constructor(core: EditorCore) {
            // Configure this
            this._core = core;
        }

        // Creates the graph
        public createGraph(containerID: string): void {
            this.canvasElement = $("#" + containerID);

            this._graph = cytoscape({
                container: this.canvasElement[0],
                zoomingEnabled: false,
                layout: {
                    name: "grid"
                }
            });

            this.canvasElement.on("resize", (event) => this._graph.resize());

            this.canvasElement.on("mousemove", (event) => {
                this.setMousePosition(event.offsetX, event.offsetY);
            });

            this.canvasElement.on("mouseup", (event) => {
                this._graph.trigger("mouseup");
            });

            this._graph.on("mouseup", (event: Cy.EventObject) => {
                if (this.onMouseUp)
                    this.onMouseUp();
            });

            // Layout
            this._graph.layout({ name: "grid" });
        }

        // Clears the graph
        public clear(): void {
            this._graph.remove(this._graph.nodes());
        }

        // Layout
        public layout(): void {
            //this._graph.layout(<any>{ name: "breadthfirst", condense: true, padding: 45, directed: false, animate: true });
            this._graph.layout(<any>{ name: 'breadthfirst', directed: true, padding: 0, spacingFactor: 1, animate: true });
        }

        // Sets the mouse position
        public setMousePosition(x: number, y: number): void {
            this._mousex = x;
            this._mousey = y;
        }

        // Adds a trigger node
        public addNode<T>(id: string, name: string, color: string, type: string, parent?: string, data?: T): string {
            // Create node
            var node = this._graph.add({
                data: <INodeData>{ id: id + "_" + SceneFactory.GenerateUUID(), name: name, type: type, actionsBuilderData: data },
            });

            // If parent
            var parentNode = parent && parent !== "" ? this._graph.nodes("[id=\"" + parent + "\"]") : parent === "" ? null : this._getNodeAtPosition(this._mousex, this._mousey);
            if (parentNode) {
                var edge = this._graph.add({
                    data: <IEdgeData>{ name: "", source: parentNode.id(), target: node.id() }
                });

                edge.css("target-arrow-shape", "triangle");
                edge.css("curve-style", "unbundled-bezier");
                edge.css("control-point-distances", "10 -10");
                edge.css("control-point-weights", "0.25 0.75");
                edge.css("label", (data["data"] && data["data"]["comment"] ? data["data"]["comment"].substr(0, 20) + "..." : ""));
            }

            // Configure node
            node.css("shape", "roundrectangle");
            node.css("background-color", color);
            node.css("width", "150px");
            node.css("height", "25px");
            node.css("font", "normal 12px");
            node.css("label", name.length > 16 ? name.substr(0, 13) + "..." : name);
            node.css("text-valign", "center");
            node.css("text-halign", "center");

            node.renderedPosition({ x: this._mousex, y: parentNode ? this._mousey + parentNode.height() + 25 : this._mousey });

            return node.id();
        }

        // Removes the given node id
        public removeNode(id: string, removeChildren: boolean = false): void {
            var node = this._graph.nodes("[id=\"" + id + "\"]");
            if (node.length === 0)
                return;
            
            var children = this.getNodesWithParent(id);

            if (removeChildren) {
                for (var i = 0; i < children.length; i++) {
                    this.removeNode(children[i], removeChildren);
                }
            }

            var edges = this._graph.edges();

            for (var i = 0; i < edges.length; i++) {
                var data = edges[i].data();
                if (data.target === id) {
                    edges[i].remove();

                    if (children.length !== 0 && !removeChildren) {
                        var edge = this._graph.add({
                            data: <IEdgeData>{ name: "", source: data.source, target: children[0] }
                        });

                        edge.css("target-arrow-shape", "triangle");
                        edge.css("curve-style", "unbundled-bezier");
                        edge.css("control-point-distances", "10 -10");
                        edge.css("control-point-weights", "0.25 0.75");
                    }
                    
                    break;
                }
            }

            node.remove();
        }

        // Returns the target node type
        // For example, a trigger MUSTN'T have any parent
        public getTargetNodeType(): string {
            var target = this._getNodeAtPosition(this._mousex, this._mousey);
            return target ? target.data().type : null;
        }

        // Returns the target node id
        public getTargetNodeId(): string {
            var target = this._getNodeAtPosition(this._mousex, this._mousey);
            return target ? target.id() : null;
        }

        // Returns the given node data
        public getNodeData<T>(id: string): T {
            var node = this._graph.nodes("[id=\"" + id + "\"]");
            return node.length > 0 ? node[0].data().actionsBuilderData : null;
        }

        // Returns the nodes which have the given parent
        public getNodesWithParent(parent: string): string[] {
            var edges = this._graph.edges();
            var nodes: string[] = [];

            for (var i = 0; i < edges.length; i++) {
                if (edges[i].data().source === parent)
                    nodes.push(edges[i].data().target);
            }

            return nodes;
        }

        // Returns the root nodes
        public getRootNodes(): string[] {
            var edges = this._graph.edges();
            var nodes = this._graph.nodes();
            var rootNodes: string[] = [];
            var found = false;

            for (var i = 0; i < nodes.length; i++) {
                found = false;
                for (var j = 0; j < edges.length; j++) {
                    if (edges[j].data().target === nodes[i].id()) {
                        found = true;
                        break;
                    }
                }

                if (!found)
                    rootNodes.push(nodes[i].id());
            }

            return rootNodes;
        }

        // Returns the node which is a position (x, y)
        private _getNodeAtPosition(x: number, y: number): Cy.CollectionElements {
            var nodes = this._graph.nodes();

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var position = node.renderedPosition();

                if (x >= (position.x - node.width() / 2) && x <= (position.x + node.width() / 2) && y >= (position.y - node.height() / 2) && y <= (position.y + node.height() / 2))
                    return node;
            }

            return null;
        }
    }
}
