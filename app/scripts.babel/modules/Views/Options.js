'use strict';

import config from '../../Config';
import { Phraseapp } from '../Api';
import { Storage } from '../Storage';
import Validator from '../Validator';
import Notification from '../Notification';

class Options {
  _getProjects() {
    Phraseapp.projects().then(projects => {
      this._setProjects(projects);
    }, response => {
      Notification.error(response);
    });
  }

  _resetForm() {
    document.getElementById('token').focus();

    document.getElementById('token').value        = '';
    document.getElementById('projects').innerHTML = '';
    document.getElementById('domain').value       = config.domain;

    this._disable(
      document.getElementById('update')
    );

    Storage.clear();

    Storage.set('phraseapp.domain', config.domain);
  }

  _checkForm() {
    const token     = document.getElementById('token');
    const saveBtn   = document.getElementById('save');
    const updateBtn = document.getElementById('update');

    if (Validator.isTokenValid(token.value)) {
      token.classList.remove('error');
      this._enable([saveBtn, updateBtn]);
    } else {
      token.classList.add('error');
      this._disable([saveBtn, updateBtn]);
    }
  }

  _saveToClipboard() {
    const clipboard = document.getElementById('clipboard');

    Storage.set('phraseapp.clipboard', clipboard.checked);
  }

  _advancedOptions() {
    const options = document.getElementById('advanced-options');
    const collapsible = document.getElementById('collapsible');

    options.classList.toggle('closed');
    collapsible.classList.toggle('open');
  }

  _saveOptions() {
    const previous = Storage.get('phraseapp.token');
    const domain   = document.getElementById('domain');
    const token    = document.getElementById('token');
    const projects = document.getElementById('projects');
    const selected = projects.options[projects.selectedIndex];
    const valid = this._saveDomain(
      domain.value.replace('www.', '')
                  .replace('http://', '')
                  .toLowerCase().trim()
    );

    if (valid && Validator.isTokenValid(token.value)) {
      this._resetOnTokenChange(previous, token, projects);

      this._saveToken(token);

      if (projects.options.length) {
        this._saveProjects(projects, selected);
      }

      Notification.success('Successfully saved options');
    }
  }

  _saveDomain(domain) {
    if (Validator.isDomainValid(domain) === true || !domain.length) {
      Storage.set('phraseapp.domain', domain);
      document.getElementById('domain').classList.remove('error');
    } else {
      document.getElementById('domain').classList.add('error');
      return false;
    }

    return true;
  }

  _selectProject() {
    const projects = document.getElementById('projects');
    const selected = projects.options[projects.selectedIndex];

    if (typeof selected !== 'undefined') {
      Storage.set(
        'phraseapp.project',
        {
          id  : selected.value,
          name: selected.text
        }
      );
      this._setDefaultLocaleForProject(selected.value);
    }
  }

  _setProjects(projects = []) {
    this._updateProjectList(
      projects,
      Storage.get('phraseapp.project')
    );

    Storage.set('phraseapp.projects', projects);
  }

  _updateProjectList(projects, defaultProject = null) {
    let selected;

    const options = [];
    const select  = document.getElementById('projects');

    projects.forEach(project => {
      selected = defaultProject && defaultProject.id === project.id
      ? 'selected=\'selected\''
      : '';

      options.push(`<option ${selected} value=${project.id}>${project.name}</option>`);
    });

    select.innerHTML = options.join('');
  }

  _setDefaultLocaleForProject(id) {
    const projects  = document.getElementById('projects');

    Phraseapp.projectLocale(id).then(locales => {
      locales.forEach(locale => {
        if (locale.code === config.locale) {
          projects.classList.remove('error');
          Storage.set('phraseapp.default.locale', locale.id);
        }
      });

      if (!locales.length) {
        projects.classList.add('error');
        Notification.error('The selected project has no locales.');
      }
    }, response => {
      projects.classList.add('error');
      Notification.error(response);
    });
  }

  _enable(elements = [], className = 'button-primary') {
    let elementList = elements;

    if (!Array.isArray(elements)) {
      elementList = [elements];
    }

    elementList.forEach(el => {
      el.removeAttribute('disabled');
      el.classList.add(className);
    });
  }

  _disable(elements = [], className = 'button-primary') {
    let elementList = elements;

    if (!Array.isArray(elements)) {
      elementList = [elements];
    }

    elementList.forEach(el => {
      el.setAttribute('disabled', true);
      el.classList.remove(className);
    });
  }

  _saveToken(token) {
    Storage.set(
      'phraseapp.token',
      token.value
    );
  }

  _saveProjects(projects, selected) {
    if (projects.options.length) {
      Storage.set(
        'phraseapp.project',
        {
          id  : selected.value,
          name: selected.text
        }
      );
    }
  }

  _resetOnTokenChange(previous, token, projects) {
    if (previous !== null && token.value !== previous) {
      projects.options.length = 0;
      Storage.remove('phraseapp.projects');
    }
  }

  _events() {
    document.getElementById('token').onkeyup = () => {
      this._checkForm();
    };
    document.getElementById('save').onclick = () => {
      this._saveOptions();
    };
    document.getElementById('reset').onclick = () => {
      this._resetForm();
    };
    document.getElementById('update').onclick = () => {
      this._selectProject();
    };
    document.getElementById('projects').onchange = () => {
      this._getProjects();
    };
    document.getElementById('clipboard').onchange = () => {
      this._saveToClipboard();
    };
    document.getElementById('collapsible').onclick = () => {
      this._advancedOptions();
    };
  }

  init() {
    let token;
    let domain;
    let clipboard;
    let projects;

    const saveBtn           = document.getElementById('save');
    const tokenInput        = document.getElementById('token');
    const domainInput       = document.getElementById('domain');
    const updateBtn         = document.getElementById('update');
    const clipboardCheckBox = document.getElementById('clipboard');

    if (null !== (clipboard = Storage.get('phraseapp.clipboard'))) {
      clipboardCheckBox.checked = clipboard;
    } else {
      clipboardCheckBox.checked = config.clipboard;
    }

    if (null !== (token = Storage.get('phraseapp.token'))) {
      tokenInput.value = token;
      this._enable(
        [saveBtn, updateBtn]
      );
    }

    if (null !== (domain = Storage.get('phraseapp.domain'))) {
      domainInput.value = domain;
    } else {
      domainInput.value = config.domain;
      Storage.set('phraseapp.domain', config.domain);
    }

    if (null !== (projects = Storage.get('phraseapp.projects'))) {
      this._setProjects(projects);
    }

    this._events();
  }
}

export { Options as default };
