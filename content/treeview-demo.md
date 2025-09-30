---
title: "TreeView Component Demo"
hidden: true
---

# TreeView Component Demo

This page demonstrates the integration of a Svelte TreeView component with Hugo using Vite as the build system. The TreeView component is powered by `@keenmate/svelte-treeview` and provides a rich, interactive hierarchical view of data.

## Basic TreeView

Here's a simple file system structure:

{{< treeview searchable="true" >}}
[
  {
    "id": "1",
    "path": "1",
    "name": "Documents",
    "icon": "📁",
    "description": "Main documents folder"
  },
  {
    "id": "1.1",
    "path": "1.1",
    "name": "Projects",
    "icon": "📁",
    "description": "Work projects"
  },
  {
    "id": "1.1.1",
    "path": "1.1.1",
    "name": "Website Redesign",
    "icon": "🌐",
    "description": "Client website project"
  },
  {
    "id": "1.1.2",
    "path": "1.1.2",
    "name": "Mobile App",
    "icon": "📱",
    "description": "iOS/Android app"
  },
  {
    "id": "1.2",
    "path": "1.2",
    "name": "Reports",
    "icon": "📊",
    "description": "Monthly reports"
  },
  {
    "id": "2",
    "path": "2",
    "name": "Images",
    "icon": "🖼️",
    "description": "Photo collection"
  },
  {
    "id": "2.1",
    "path": "2.1",
    "name": "Vacation 2024",
    "icon": "🏖️",
    "description": "Summer vacation photos"
  },
  {
    "id": "2.2",
    "path": "2.2",
    "name": "Screenshots",
    "icon": "📸",
    "description": "UI screenshots"
  }
]
{{< /treeview >}}

## Features Demonstrated

This page showcases several key features of the TreeView component:

1. **Hierarchical Data Display**: Shows nested structures with clear parent-child relationships
2. **Search Functionality**: Each TreeView includes a search box for filtering nodes
3. **Custom Icons**: Each node can have a custom emoji or icon
4. **Descriptions**: Additional context information for each node
5. **Hugo Integration**: Seamlessly embedded within Hugo content using shortcodes
6. **Responsive Design**: Adapts to different screen sizes
7. **Interactive**: Click on nodes to see console output (check browser dev tools)

## Technical Implementation

The TreeView component is built using:

- **Svelte 5**: Modern component framework with runes
- **@keenmate/svelte-treeview**: High-performance tree component library
- **Vite**: Build tool for processing and bundling
- **Hugo Shortcodes**: Easy integration within Markdown content
- **Web Components**: Custom elements for cross-framework compatibility

The data is passed from Hugo's front matter through the shortcode to the Svelte component, demonstrating a clean integration between static site generation and dynamic UI components.
