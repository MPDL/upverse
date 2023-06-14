export interface Datasets {
    success: boolean;
    data:    DatasetsData;
}

export interface DatasetsData {
    pagination:       Pagination;
    items:            Item[];
    total_count:      number;
    start:            number;
    search_term:      string;
    dvobject_counts:  DvobjectCounts;
    pubstatus_counts: PubstatusCounts;
    selected_filters: SelectedFilters;
}

export interface DvobjectCounts {
    dataverses_count: number;
    files_count:      number;
    datasets_count:   number;
}

export interface Item {
    name:                    string;
    type:                    string;
    url:                     string;
    global_id:               string;
    description:             string;
    published_at:            Date;
    citationHtml:            string;
    citation:                string;
    matches:                 any[];
    score:                   number;
    entity_id:               number;
    api_url:                 string;
    authors:                 string[];
    publication_statuses:    string[];
    is_draft_state:          boolean;
    is_in_review_state:      boolean;
    is_unpublished_state:    boolean;
    is_published:            boolean;
    is_deaccesioned:         boolean;
    date_to_display_on_card: string;
    parentId:                string;
    parentName:              string;
    parent_alias:            string;
    user_roles:              string[];
}

export interface Pagination {
    isNecessary:           boolean;
    numResults:            number;
    numResultsString:      string;
    docsPerPage:           number;
    selectedPageNumber:    number;
    pageCount:             number;
    hasPreviousPageNumber: boolean;
    previousPageNumber:    number;
    hasNextPageNumber:     boolean;
    nextPageNumber:        number;
    startCardNumber:       number;
    endCardNumber:         number;
    startCardNumberString: string;
    endCardNumberString:   string;
    remainingCards:        number;
    numberNextResults:     number;
    pageNumberList:        number[];
}

export interface PubstatusCounts {
    unpublished_count:   number;
    draft_count:         number;
    published_count:     number;
    deaccessioned_count: number;
    in_review_count:     number;
}

export interface SelectedFilters {
    publication_statuses: string[];
    role_names:           string[];
}

export interface User {
    status: string;
    data:   UserData;
}

export interface UserData {
    id:                       number;
    identifier:               string;
    displayName:              string;
    firstName:                string;
    lastName:                 string;
    email:                    string;
    superuser:                boolean;
    deactivated:              boolean;
    affiliation:              string;
    position:                 string;
    persistentUserId:         string;
    emailLastConfirmed:       Date;
    createdTime:              Date;
    lastLoginTime:            Date;
    lastApiUseTime:           Date;
    authenticationProviderId: string;
}

export interface Files {
    status: string;
    data:   FilesData;
}

export interface FilesData {
    files: File[];
}

export interface File {
    description:      string;
    label:            string;
    restricted:       boolean;
    version:          number;
    datasetVersionId: number;
    categories:       string[];
    dataFile:         DataFile;
}

export interface DataFile {
    id:                number;
    persistentId:      string;
    pidURL:            string;
    filename:          string;
    contentType:       string;
    filesize:          number;
    description:       string;
    storageIdentifier: string;
    rootDataFileId:    number;
    md5:               string;
    checksum:          Checksum;
    creationDate:      Date;
}

export interface Checksum {
    type:  string;
    value: string;
}


