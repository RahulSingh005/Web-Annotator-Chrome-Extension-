document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ type: 'GET_ANNOTATIONS', url: window.location.href }, (response) => {
    if (response.status === 'success') {
      response.annotations.forEach(applyAnnotation);
    } else {
      console.error(response.message);
    }
  });

document.addEventListener('mouseup', showContextMenu);
});

(function() {
let annotations = [];
function saveAnnotations(annotation) {
    chrome.storage.local.get('annotations', (result) => {
        let storedAnnotations = result.annotations;
        if (storedAnnotations !== undefined && !Array.isArray(storedAnnotations)) {
          console.error('Annotations are not an array:', storedAnnotations);
          storedAnnotations = [];
        }
        storedAnnotations.push(annotation);
        chrome.storage.local.set({ annotations: storedAnnotations }, () => {
            console.log('Annotation saved successfully');
        });
    });
}

function loadAnnotations(callback) {
  chrome.storage.local.get('annotations', (result) => {
    console.log('Loaded annotations:', result.annotations);

    let storedAnnotations = result.annotations;

    if (!Array.isArray(storedAnnotations)) {
      console.error('Annotations are not an array:', storedAnnotations);
      storedAnnotations = [];
    }

    annotations = storedAnnotations.map(ann => {
      const range = document.createRange();
      const startNode = getNodeByXPath(ann.range.startContainerXPath);
      const endNode = getNodeByXPath(ann.range.endContainerXPath);

      if (startNode && endNode) {
        range.setStart(startNode, ann.range.startOffset);
        range.setEnd(endNode, ann.range.endOffset);
      }

      return {
        ...ann,
        range
      };
    });

    callback(annotations);
  });
}

function getNodeByXPath(xpath) {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}

function applyAnnotations() {
  annotations.forEach(annotation => {
    if (annotation.pageUrl === window.location.href) {
      const regex = new RegExp(annotation.text, 'g');
      document.body.innerHTML = document.body.innerHTML.replace(regex, (match) => {
        const span = document.createElement('span');
        span.textContent = match;
        span.style.backgroundColor = annotation.color;
        span.className = 'annotated-text';
        return span.outerHTML;
      });
    }
  });
}

loadAnnotations((loadedAnnotations) => {
  annotations = loadedAnnotations;
  applyAnnotations();
});

function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'annotator-sidebar';
    sidebar.innerHTML = `
      <h3 id="web" title="Web Annotator">WA</h3>
      <button id="highlight-yellow" class="yellow" title="Highlight Yellow"></button>
      <button id="highlight-green" class="green" title="Highlight Green"></button>
      <button id="highlight-blue" class="blue" title="Highlight Blue"></button>
      <button id="highlight-red" class="red" title="Highlight Red"></button>
  
      <button id="erase" class="Erase" title="Erase">
      <svg width="28" height="28" viewBox="0 0 20 20" class=""><path d="M11.2 2.44a1.5 1.5 0 012.12 0l4.24 4.24a1.5 1.5 0 010 2.12L9.36 17h5.14a.5.5 0 010 1H7.82a1.5 1.5 0 01-1.14-.44l-4.24-4.24a1.5 1.5 0 010-2.12l8.76-8.76zm1.41.7a.5.5 0 00-.7 0L5.53 9.52l4.95 4.95 6.36-6.36a.5.5 0 000-.71l-4.24-4.24zM9.78 15.18l-4.95-4.95-1.69 1.69a.5.5 0 000 .7l4.25 4.25c.2.2.5.2.7 0l1.7-1.7z"></path></svg></button>
      
      <button id="undo" title="Undo">
      <svg width="28" height="28" viewBox="0 0 20 20" class=""><path d="M3 10a7 7 0 1110 6.33V14.5a.5.5 0 00-1 0v3c0 .28.22.5.5.5h3a.5.5 0 000-1h-1.62A8 8 0 102 10a.5.5 0 001 0z"></path><path d="M10 12a2 2 0 100-4 2 2 0 000 4zm0-1a1 1 0 110-2 1 1 0 010 2z"></path></svg></button>
      
      <button id="add-note" class="note" title="Add Note">
      <svg width="28" height="28" viewBox="2 2 20 20">
      <path d="M12.6 7.2H15.6V7.8C15.6 8.252 15.952 8.6 16.4 8.6C16.848 8.6 17.2 8.252 17.2 7.8V6.6C17.2 6.148 16.848 5.8 16.4 5.8H7.6C7.148 5.8 6.8 6.148 6.8 6.6V7.8C6.8 8.252 7.148 8.6 7.6 8.6C8.052 8.6 8.4 8.252 8.4 7.8V7.2H10.8V16.8H10.4C9.948 16.8 9.6 17.148 9.6 17.6C9.6 18.052 9.948 18.4 10.4 18.4H13.6C14.052 18.4 14.4 18.052 14.4 17.6C14.4 17.148 14.052 16.8 13.6 16.8H12.6V7.2ZM2.4 7.2C2.4 5.2116 3.8116 3.8 5.8 3.8H18.2C20.1884 3.8 21.6 5.2116 21.6 7.2V16.8C21.6 18.7884 20.1884 20.2 18.2 20.2H5.8C3.8116 20.2 2.4 18.7884 2.4 16.8V7.2ZM5.8 4.8C4.8036 4.8 4 5.6036 4 6.6V16.8C4 17.7964 4.8036 18.6 5.8 18.6H18.2C19.1964 18.6 20 17.7964 20 16.8V6.6C20 5.6036 19.1964 4.8 18.2 4.8H5.8Z"></path>
      </svg></button>
      
      <button id="view-note" class="view" title="View Notes">
      <svg width="28" height="28" viewBox="0 0 20 20" class=""><path d="M3 6.5a1 1 0 100-2 1 1 0 000 2z"></path><path d="M6 5.5c0-.28.22-.5.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"></path><path d="M6 9.5c0-.28.22-.5.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"></path><path d="M10.5 13a.5.5 0 000 1h7a.5.5 0 000-1h-7z"></path><path d="M8 13.5a1 1 0 11-2 0 1 1 0 012 0z"></path><path d="M3 10.5a1 1 0 100-2 1 1 0 000 2z"></path></svg>
      </button>
      
      <button id="save-pdf-btn" class="PDF" title="Save as PDF">
      <svg width="28" height="28" viewBox="0 0 20 20" class=""><path d="M3 5c0-1.1.9-2 2-2h8.38a2 2 0 011.41.59l1.62 1.62A2 2 0 0117 6.62V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v10a1 1 0 001 1v-4.5c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5V16a1 1 0 001-1V6.62a1 1 0 00-.3-.7L14.1 4.28a1 1 0 00-.71-.29H13v2.5c0 .83-.67 1.5-1.5 1.5h-4A1.5 1.5 0 016 6.5V4H5zm2 0v2.5c0 .28.22.5.5.5h4a.5.5 0 00.5-.5V4H7zm7 12v-4.5a.5.5 0 00-.5-.5h-7a.5.5 0 00-.5.5V16h8z"></path></svg></button>
      </button>
      <div id="notes-container"></div>
    `;
    document.body.appendChild(sidebar);
    document.getElementById('annotator-sidebar').addEventListener('click', (event) => {
      const target = event.target;
      if (target.id === 'highlight-yellow') {
        highlightText('yellow');
      } else if (target.id === 'highlight-green') {
        highlightText('lightgreen');
      } else if (target.id === 'highlight-blue') {
        highlightText('skyblue');
      } else if (target.id === 'highlight-red') {
        highlightText('red');
      }
      else if (target.id === 'erase') {
        erase();
      }
       else if (target.id === 'add-note') {
        addNote();
      }
       else if (target.id === 'view-note') {
        displayNotes();
      }
       else if (target.id === 'save-pdf-btn') {
        console.log("Save As Pdf function need to be completed");
      }
      else if(target.id ==='undo'){
        undoErase();
      }
    });
  }

function highlightText(color) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.className = 'annotated-text';
    range.surroundContents(span);

    annotations.push({
      text: selection.toString(),
      color: color,
      note: '',
      pageUrl: window.location.href,
      date: new Date().toISOString()
    });
    saveAnnotations();
    selection.removeAllRanges();
  }

function addNote() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = range.commonAncestorContainer.parentNode;
    if (span && span.classList.contains('annotated-text')) {
        const note = prompt('Enter your note:');
        if (note) {
            const annotation = annotations.find(ann => ann.text === span.textContent);
            if (annotation) {
                annotation.note = note;
                saveAnnotations();
                displayNotes();
            } else {
                console.error('Annotation not found for the selected text:', span.textContent);
            }
        } else {
            console.error('Note is empty or canceled by the user.');
        }
    } else {
        console.error('No annotated text selected.');
    }
}

function saveAnnotations() {
  chrome.storage.local.get('annotations', (result) => {
      let storedAnnotations = result.annotations;
      if (storedAnnotations !== undefined && !Array.isArray(storedAnnotations)) {
          console.error('Annotations are not an array:', storedAnnotations);
          storedAnnotations = [];
      }
      storedAnnotations = annotations.map(ann => {
          return {
              ...ann,
              note: ann.note
          };
      });
      chrome.storage.local.set({ annotations: storedAnnotations }, () => {
          console.log('Annotations saved successfully');
      });
  });
}

let removedAnnotations = [];
function erase() {
    document.body.style.cursor = 'pointer';
    document.addEventListener('mousedown', initiateErase);
    document.addEventListener('mouseup', finishErase);
}
let originalBackgroundColors = {};
function initiateErase(event) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const span = range.commonAncestorContainer.parentNode;
  if (span && span.classList.contains('annotated-text')) {
    console.log('Annotation text:', span.textContent);
    const computedStyle = window.getComputedStyle(span);
    const originalBackgroundColor = computedStyle.backgroundColor;
    originalBackgroundColors[span.textContent] = originalBackgroundColor; 
    document.addEventListener('mousemove', eraseAnnotation);
    if (!removedAnnotations.includes(span)) {
      removedAnnotations.push(span);
    }
    event.preventDefault();
  }
}

let varim;
function eraseAnnotation(event) {
  const elements = document.elementsFromPoint(event.clientX, event.clientY);
  elements.forEach(element => {
    if (element.classList.contains('annotated-text')) {
      console.log('Erasing annotation text:', element.textContent);
      varim=element.style.backgroundColor;
      element.style.backgroundColor = 'transparent';
    }
  });
}

function finishErase() {
  document.body.style.cursor = 'auto';
  document.removeEventListener('mousemove', eraseAnnotation);
}

function undoErase() {
  if (removedAnnotations.length > 0) {
    const annotation = removedAnnotations.pop();
    const originalBackgroundColor = originalBackgroundColors[annotation.textContent];
    if (originalBackgroundColor) {
      annotation.style.backgroundColor = varim;
    } else {
      annotation.style.backgroundColor = '';
    }
    console.log('Undoing erase for annotation text:', annotation.textContent);
  }
}

function displayNotes() {
  const notesWindow = window.open('', 'Annotations', 'width=600,height=400');
  notesWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Annotations</title>
          <style>
              .annotation-container {
                  margin-bottom: 10px;
              }
              .highlighted-text {
                  display: inline-block;
                  padding: 3px;
              }
              .note {
                  margin-top: 5px;
                  margin-left: 20px;
              }
              #save-pdf-btn {
                  margin-top: 20px;
                  cursor: pointer;
                  padding: 10px;
                  background-color: #007bff;
                  color: #fff;
                  border: none;
                  border-radius: 5px;
              }
          </style>
      </head>
      <body id="pdf1">
          <h1>Notes</h1>
          <ul id="notes-container"></ul>
          <button id="save-pdf-btn">Save as PDF</button>
      </body>
      </html>
  `);
  const notesContainer = notesWindow.document.getElementById('notes-container');
  annotations.forEach(annotation => {
    const annotationItem = notesWindow.document.createElement('li');
    annotationItem.classList.add('annotation-container');
    const highlightedTextSpan = notesWindow.document.createElement('span');
    highlightedTextSpan.textContent = annotation.text;
    highlightedTextSpan.style.backgroundColor = annotation.color;
    highlightedTextSpan.classList.add('highlighted-text');
    const noteDiv = notesWindow.document.createElement('div');
    noteDiv.classList.add('note');
    noteDiv.textContent = `Note: ${annotation.note}`;
    annotationItem.appendChild(highlightedTextSpan);
    annotationItem.appendChild(noteDiv);
    notesContainer.appendChild(annotationItem);
  });
  const savePdfButton = notesWindow.document.getElementById('save-pdf-btn');
  savePdfButton.addEventListener('click', () => {
    notesWindow.print();
});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_SIDEBAR') {
      const sidebar = document.getElementById('annotator-sidebar');
      if (sidebar) {
        sidebar.remove();
      } else {
        createSidebar();
        loadAnnotations(displayNotes);
      }
    }
});
})();



